import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI eBook Creator — Generate Complete eBooks with AI',
  description:
    'Generate professional eBooks from a single topic. AI writes the title, outline, and every chapter. Export to PDF instantly.',
  keywords: ['ebook', 'ai', 'pdf', 'generator', 'openai', 'content creation'],
  openGraph: {
    title: 'AI eBook Creator',
    description: 'Generate complete eBooks with AI in minutes',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body>{children}</body>
    </html>
  );
}
