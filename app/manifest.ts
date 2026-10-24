import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'THE LAW: REBIRTH',
    short_name: 'THE LAW: REBIRTH',
    description: 'Une fiction interactive. Chaque choix laisse une trace.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#090809',
    theme_color: '#090809',
    lang: 'fr',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
