import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const host = 'polytranscript.com';
    const key = '9f7d4b2e1a8c3d5e7f9a1b3c5d7e9f1a';
    const keyLocation = `https://${host}/${key}.txt`;

    const urlList = [
      `https://${host}/`,
      `https://${host}/youtube-transcript-generator`,
      `https://${host}/youtube-shorts-transcript-generator`,
      `https://${host}/youtube-to-srt-converter`,
      `https://${host}/tiktok-transcript-generator`,
      `https://${host}/tiktok-captions-extractor`,
      `https://${host}/podcast-transcript-generator`,
      `https://${host}/spotify-podcast-transcript-generator`,
      `https://${host}/mp3-to-text-converter`,
      `https://${host}/alternatives/transcriptapi-alternative`,
      `https://${host}/alternatives/descript-alternative`,
      `https://${host}/pricing`,
      `https://${host}/docs`,
      `https://${host}/api-keys`,
    ];

    const payload = {
      host,
      key,
      keyLocation,
      urlList,
    };

    // Ping Bing IndexNow
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    return NextResponse.json({
      success: true,
      status: response.status,
      message: 'URLs submitted to IndexNow search engines for instant indexing.',
      urls_submitted: urlList.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
