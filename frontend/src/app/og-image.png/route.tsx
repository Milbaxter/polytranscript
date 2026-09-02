import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: 'linear-gradient(135deg, #0b0f19 0%, #1e1b4b 55%, #4c1d95 100%)',
          color: 'white',
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: 4, textTransform: 'uppercase', color: '#a5b4fc' }}>
          MCP-ready transcripts
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, marginTop: 12 }}>PolyTranscript</div>
        <div style={{ fontSize: 28, marginTop: 20, color: '#c7d2fe', maxWidth: 900 }}>
          YouTube • TikTok • Podcasts — timestamped text for Claude, Cursor, and your API.
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
