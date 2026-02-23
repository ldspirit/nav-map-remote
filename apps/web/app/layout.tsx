import './globals.css';

export const metadata = {
  title: 'Nav Map Remote',
  description: 'Africa Digital Map Platform'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
