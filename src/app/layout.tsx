import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IMC Test - Image Model Comparison',
  description: 'Test and compare image editing large language models from different providers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
