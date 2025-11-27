import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Helper to pad chapter numbers (1 -> "001") to match your folder naming
const pad = (num: string | number, size: number) => {
    const s = "000000000" + num;
    return s.substr(s.length - size);
};

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const chapter = searchParams.get('chapter'); // e.g. "1"

    if (!chapter) return new NextResponse('Missing Chapter ID', { status: 400 });

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const rootFolderId = process.env.GOOGLE_MANGA_ROOT_ID; // The ID of "My Hero Academia Manga" folder

    if (!clientId || !clientSecret || !refreshToken || !rootFolderId) {
        return new NextResponse('Missing Google Config', { status: 500 });
    }

    try {
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
        oauth2Client.setCredentials({ refresh_token: refreshToken });

        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        // 1. Find the specific Chapter Folder (e.g., "Ch_001") inside the Root Folder
        const folderName = `Ch_${pad(chapter, 3)}`; // Matches "Ch_001"
        
        const folderQuery = `name = '${folderName}' and '${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
        
        const folderRes = await drive.files.list({
            q: folderQuery,
            fields: 'files(id, name)',
        });

        if (!folderRes.data.files || folderRes.data.files.length === 0) {
            return new NextResponse(`Folder ${folderName} not found`, { status: 404 });
        }

        const chapterFolderId = folderRes.data.files[0].id;

        // 2. List all images inside that Chapter Folder
        // We filter for images and sort by name to ensure pages are in order (page001_01, page001_02)
        const filesRes = await drive.files.list({
            q: `'${chapterFolderId}' in parents and mimeType contains 'image/' and trashed = false`,
            fields: 'files(id, name)',
            orderBy: 'name', // Critical: Sorts page01, page02, etc.
            pageSize: 100 // Adjust if chapters have more than 100 pages
        });

        const files = filesRes.data.files || [];

        // 3. Transform into usable URLs
        // We reuse your existing /api/stream route to proxy the images securely!
        const pages = files.map(file => ({
            id: file.id,
            name: file.name,
            src: `/api/stream?fileId=${file.id}` // Reuse your video proxy logic for images
        }));

        return NextResponse.json({ pages });

    } catch (error) {
        console.error('Drive API Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}