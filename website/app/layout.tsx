import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "TESSERACT '26 - National Level Symposium",
  description: "TESSERACT '26 National Level Symposium organized by Department of ECE, Aalim Muhammed Salegh College of Engineering.",
  icons: { icon: '/static/images/favicon.ico' }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
