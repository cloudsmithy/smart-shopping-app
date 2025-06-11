import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AnalyticsProvider } from "./providers";

export const metadata: Metadata = {
  title: "拍立懂",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-ZH4ZGWTKDY"
          strategy="afterInteractive"
        ></Script>
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-ZH4ZGWTKDY');
          `}
        </Script>
      </head>
      <body>
        <AnalyticsProvider />
        {children}
      </body>
    </html>
  );
}
