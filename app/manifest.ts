import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'THE LAW',
    short_name: 'THE LAW',
    description:
      'Une fiction interactive où chaque choix devient loi. Every choice becomes law.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0d0d10',
    theme_color: '#0d0d10',
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
