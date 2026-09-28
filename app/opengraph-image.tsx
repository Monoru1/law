import { ImageResponse } from 'next/og';

export const alt = 'THE LAW — Every choice becomes law.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: 'center',
        background: '#0d0d10',
        color: '#efece4',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Georgia, serif',
        height: '100%',
        justifyContent: 'center',
        letterSpacing: '-0.04em',
        width: '100%',
      }}
    >
      <div style={{ fontSize: 164, lineHeight: 1 }}>THE LAW</div>
      <div
        style={{
          borderTop: '2px solid #efece4',
          fontFamily: 'Arial, sans-serif',
          fontSize: 34,
          letterSpacing: '0.12em',
          marginTop: 52,
          paddingTop: 28,
          textTransform: 'uppercase',
        }}
      >
        Every choice becomes law.
      </div>
    </div>,
    size,
  );
}
