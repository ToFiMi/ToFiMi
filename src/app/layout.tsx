'use client';
import "./globals.css";
import { PwaInit } from "@/app/pwa-init";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <head>
            <link rel="manifest" href="/manifest.json" />
            <meta name="theme-color" content="#ffffff" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            <meta name="apple-mobile-web-app-title" content="PushApp" />
            <link rel="apple-touch-icon" href="/icon-192x192.png" />
        </head>
        <body>
        <PwaInit />
        {children}
        </body>
        </html>
    );
}
