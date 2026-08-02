import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Jagdamba Petroleum - Customer Feedback Portal",
  description: "Share your feedback with Jagdamba Petroleum to help us improve our services.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-900 antialiased min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
