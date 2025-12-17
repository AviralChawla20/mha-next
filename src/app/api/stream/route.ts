import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fileId = searchParams.get('fileId');

  console.log(`[STREAM] Request for fileId: ${fileId}`);

  if (!fileId) {
    return new NextResponse('Missing File ID', { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.error("Missing Env Vars: Check .env.local");
    return new NextResponse('Missing Google Auth Credentials in .env.local', { status: 500 });
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const { token } = await oauth2Client.getAccessToken();

    if (!token) {
      throw new Error("Failed to generate access token");
    }

    const driveHeaders: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    const range = request.headers.get('range');
    console.log(`[STREAM] Range header: ${range || 'none'}`);
    
    if (range) {
      driveHeaders['Range'] = range;
    }

    const driveResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: driveHeaders,
      }
    );

    console.log(`[STREAM] Drive response status: ${driveResponse.status}`);
    console.log(`[STREAM] Content-Type: ${driveResponse.headers.get('Content-Type')}`);
    console.log(`[STREAM] Content-Length: ${driveResponse.headers.get('Content-Length')}`);
    console.log(`[STREAM] Accept-Ranges: ${driveResponse.headers.get('Accept-Ranges')}`);

    console.log(`[STREAM] All Drive Headers:`);
driveResponse.headers.forEach((value, key) => {
  console.log(`  ${key}: ${value}`);
});

    if (!driveResponse.ok) {
        const errorText = await driveResponse.text();
        console.error(`Google Drive API Error (${driveResponse.status}):`, errorText);
        return new NextResponse(`Google Drive Error: ${driveResponse.statusText}`, { status: driveResponse.status });
    }

    const responseHeaders = new Headers();
    
    const contentType = driveResponse.headers.get('Content-Type');
    const contentLength = driveResponse.headers.get('Content-Length');
    const contentRange = driveResponse.headers.get('Content-Range');
    const acceptRanges = driveResponse.headers.get('Accept-Ranges');
    
    if (contentType) {
      responseHeaders.set('Content-Type', contentType);
    }
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }
    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange);
    }
    
    // CRITICAL: Always set Accept-Ranges for video streaming
    responseHeaders.set('Accept-Ranges', acceptRanges || 'bytes');
    
    // Add CORS headers (in case that's an issue)
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    
    console.log(`[STREAM] Streaming back to client with status ${driveResponse.status}`);

    return new NextResponse(driveResponse.body, {
      status: driveResponse.status,
      statusText: driveResponse.statusText,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error('[STREAM] Error:', error.message);
    if (error.response && error.response.data) {
        console.error('[STREAM] Google API Error Details:', JSON.stringify(error.response.data, null, 2));
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}