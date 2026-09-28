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

const description =
  'Une fiction interactive où chaque choix devient loi. Every choice becomes law.';

export const metadata: Metadata = {
  metadataBase,
  ...(canonicalSiteUrl
    ? { alternates: { canonical: new URL('/', canonicalSiteUrl) } }
    : {}),
  applicationName: 'THE LAW',
  title: {
    default: 'THE LAW',
    template: '%s — THE LAW',
  },
  description,
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'THE LAW',
    title: 'THE LAW',
    description,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'THE LAW',
    description,
  },
  appleWebApp: {
    capable: true,
    title: 'THE LAW',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#0d0d10',
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
