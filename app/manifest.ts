import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'THE LAW: REBIRTH',
    short_name: 'THE LAW: REBIRTH',
    description: 'Les Archives du silence. Un thriller interactif à Valombre.',
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
