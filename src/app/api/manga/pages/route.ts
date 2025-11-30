import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// --- HELPER: Smart Chapter Formatting ---
// Handles "1" -> "001"
// Handles "23.5" -> "023.5"
const formatChapterName = (chapter: string) => {
    if (!chapter) return "";
    
    const parts = chapter.toString().split('.');
    const whole = parts[0];
    const decimal = parts.length > 1 ? '.' + parts[1] : '';
    
    // Pad the whole number part to 3 digits (e.g., "1" -> "001", "23" -> "023")
    const paddedWhole = whole.padStart(3, '0');
    
    return paddedWhole + decimal;
};

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const chapter = searchParams.get('chapter'); 

    if (!chapter) return new NextResponse('Missing Chapter ID', { status: 400 });

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const rootFolderId = process.env.GOOGLE_MANGA_ROOT_ID; 

    if (!clientId || !clientSecret || !refreshToken || !rootFolderId) {
        return new NextResponse('Missing Google Config', { status: 500 });
    }

    try {
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
        oauth2Client.setCredentials({ refresh_token: refreshToken });

        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        // 1. Find the specific Chapter Folder
        // Uses the smart formatter: 23.5 becomes "Ch_023.5"
        const folderName = `Ch_${formatChapterName(chapter)}`; 
        
        // Query: Find folder with this name inside the root folder
        const folderQuery = `name = '${folderName}' and '${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
        
        const folderRes = await drive.files.list({
            q: folderQuery,
            fields: 'files(id, name)',
        });

        if (!folderRes.data.files || folderRes.data.files.length === 0) {
            console.error(`Folder not found for: ${folderName}`);
            return new NextResponse(`Folder ${folderName} not found`, { status: 404 });
        }

        const chapterFolderId = folderRes.data.files[0].id;

        // 2. List all images inside that Chapter Folder
        const filesRes = await drive.files.list({
            q: `'${chapterFolderId}' in parents and mimeType contains 'image/' and trashed = false`,
            fields: 'files(id, name)',
            orderBy: 'name', // Sorts page01, page02...
            pageSize: 100 
        });

        const files = filesRes.data.files || [];

        // 3. Transform into usable URLs
        const pages = files.map(file => ({
            id: file.id,
            name: file.name,
            src: `/api/stream?fileId=${file.id}`
        }));

        return NextResponse.json({ pages });

    } catch (error: any) {
        console.error('Drive API Error:', error.message);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}