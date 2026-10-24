import { ImageResponse } from 'next/og';

export const alt = 'THE LAW: REBIRTH — Chaque choix laisse une trace.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: 'center',
        background: '#090809',
        color: '#E6DED3',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Georgia, serif',
        height: '100%',
        justifyContent: 'center',
        letterSpacing: '-0.04em',
        width: '100%',
      }}
    >
      <div style={{ fontSize: 100, lineHeight: 1 }}>THE LAW: REBIRTH</div>
      <div
        style={{
          borderTop: '2px solid #E6DED3',
          fontFamily: 'Arial, sans-serif',
          fontSize: 34,
          letterSpacing: '0.12em',
          marginTop: 52,
          paddingTop: 28,
          textTransform: 'uppercase',
        }}
      >
        Chaque choix laisse une trace.
      </div>
    </div>,
    size,
  );
}
