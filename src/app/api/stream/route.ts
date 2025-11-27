import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fileId = searchParams.get('fileId');

  if (!fileId) {
    return new NextResponse('Missing File ID', { status: 400 });
  }

  // 1. Load credentials from Environment
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.error("Missing Env Vars: Check .env.local");
    return new NextResponse('Missing Google Auth Credentials in .env.local', { status: 500 });
  }

  try {
    // 2. Setup OAuth2 Client
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      "https://developers.google.com/oauthplayground" // Redirect URL (must match what you used to generate the token)
    );

    oauth2Client.setCredentials({ refresh_token: refreshToken });

    // 3. Get a fresh Access Token
    // This handles token expiration automatically!
    const { token } = await oauth2Client.getAccessToken();

    if (!token) {
      throw new Error("Failed to generate access token");
    }

    // 4. Prepare Headers for Google Drive
    // We forward the 'Range' header from the browser (video player) to Google
    // This enables seeking/scrubbing in the video.
    const driveHeaders: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    const range = request.headers.get('range');
    if (range) {
      driveHeaders['Range'] = range;
    }

    // 5. Fetch the video stream from Google Drive API
    const driveResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: driveHeaders,
      }
    );

    if (!driveResponse.ok) {
        const errorText = await driveResponse.text();
        console.error(`Google Drive API Error (${driveResponse.status}):`, errorText);
        return new NextResponse(`Google Drive Error: ${driveResponse.statusText}`, { status: driveResponse.status });
    }

    // 6. Stream it back to the client
    // We pass along the Content-Type, Content-Length, and Content-Range headers
    // so the browser knows it's a video file.
    const responseHeaders = new Headers();
    if (driveResponse.headers.get('Content-Type')) {
      responseHeaders.set('Content-Type', driveResponse.headers.get('Content-Type')!);
    }
    if (driveResponse.headers.get('Content-Length')) {
      responseHeaders.set('Content-Length', driveResponse.headers.get('Content-Length')!);
    }
    if (driveResponse.headers.get('Content-Range')) {
      responseHeaders.set('Content-Range', driveResponse.headers.get('Content-Range')!);
    }
    if (driveResponse.headers.get('Accept-Ranges')) {
      responseHeaders.set('Accept-Ranges', driveResponse.headers.get('Accept-Ranges')!);
    }

    return new NextResponse(driveResponse.body, {
      status: driveResponse.status,
      statusText: driveResponse.statusText,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error('Stream Error:', error.message);
    // Log detailed Google API error if available
    if (error.response && error.response.data) {
        console.error('Google API Error Details:', JSON.stringify(error.response.data, null, 2));
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}