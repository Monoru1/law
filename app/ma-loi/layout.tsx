import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Carnet de Gabriel',
  description:
    'Les pièces, les hypothèses et les sauvegardes de ton enquête à Valombre.',
  robots: { index: false, follow: false },
};

export default function MyLawLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
