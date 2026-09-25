import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
const display=localFont({src:'../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2',variable:'--font-display',display:'swap'});
const meta=localFont({src:'../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2',variable:'--font-meta',display:'swap'});
const body=localFont({src:'../node_modules/@fontsource/inter-tight/files/inter-tight-latin-400-normal.woff2',variable:'--font-body',display:'swap'});
export const metadata:Metadata={title:'THE LAW — La Pièce',description:'Chaque choix laisse une trace.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fr" className={`${display.variable} ${meta.variable} ${body.variable}`}><body>{children}</body></html>}
