import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ma loi',
  description: 'Le registre local de tes décisions et de tes lois.',
  robots: { index: false, follow: false },
};

export default function MyLawLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
