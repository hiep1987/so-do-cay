import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { Source_Code_Pro } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

// Vietnamese-capable monospace font for code blocks with Vietnamese text
const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["400", "500", "600"],
});

const siteUrl = "https://math2app.com/so-do-cay";

export const metadata: Metadata = {
  title: "Sơ đồ Cây – Tree Diagram Builder",
  description: "Web app vẽ sơ đồ cây xác suất, xuất TikZ/SVG/PNG",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Sơ đồ Cây – Tree Diagram Builder",
    description: "Web app vẽ sơ đồ cây xác suất, xuất TikZ/SVG/PNG",
    url: siteUrl,
    siteName: "Sơ đồ Cây",
    images: [
      {
        url: "/og-thumbnail.jpg",
        width: 1200,
        height: 630,
        alt: "Sơ đồ Cây – Tree Diagram Builder",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sơ đồ Cây – Tree Diagram Builder",
    description: "Web app vẽ sơ đồ cây xác suất, xuất TikZ/SVG/PNG",
    images: ["/og-thumbnail.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark" suppressHydrationWarning>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-YBC9S6B3D9"
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-YBC9S6B3D9');
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${sourceCodePro.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
