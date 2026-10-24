import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { OfflineStatus } from './offline-status';
import './globals.css';
const display = localFont({
  src: '../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2',
  variable: '--font-display',
  display: 'swap',
});
const meta = localFont({
  src: '../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2',
  variable: '--font-meta',
  display: 'swap',
});
const body = localFont({
  src: '../node_modules/@fontsource/inter-tight/files/inter-tight-latin-400-normal.woff2',
  variable: '--font-body',
  display: 'swap',
});
const canonicalSiteUrl = process.env.SITE_URL || process.env.URL;
const deploymentUrl = process.env.DEPLOY_PRIME_URL || canonicalSiteUrl;
const metadataBase = new URL(deploymentUrl || 'http://localhost:3000');

const description = 'Une fiction interactive. Chaque choix laisse une trace.';

export const metadata: Metadata = {
  metadataBase,
  ...(canonicalSiteUrl
    ? { alternates: { canonical: new URL('/', canonicalSiteUrl) } }
    : {}),
  applicationName: 'THE LAW: REBIRTH',
  title: {
    default: 'THE LAW: REBIRTH',
    template: '%s — THE LAW: REBIRTH',
  },
  description,
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'THE LAW: REBIRTH',
    title: 'THE LAW: REBIRTH',
    description,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'THE LAW: REBIRTH',
    description,
  },
  appleWebApp: {
    capable: true,
    title: 'THE LAW: REBIRTH',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#090809',
  colorScheme: 'dark',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${display.variable} ${meta.variable} ${body.variable}`}
    >
      <body>
        <OfflineStatus />
        {children}
      </body>
    </html>
  );
}
