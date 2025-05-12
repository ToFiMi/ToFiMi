
import "./globals.css";
import { PwaInit } from "@/app/pwa-init";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import  AuthLayout  from "@/componets/layouts/auth-layout";
import '@ant-design/v5-patch-for-react-19';
import {cookies} from "next/headers";
import {getToken} from "next-auth/jwt";
type JWTPayload = {
    user_id: string
    role?: 'ADMIN' | 'user' | 'leader' | 'animator'
    isAdmin?: boolean
}
export default async function RootLayout({ children }: { children: React.ReactNode }) {

    const token = await getToken({ req: { cookies: await cookies() } as any, secret: process.env.NEXTAUTH_SECRET  })

    const role = token?.role ?? null
    const userId = token?.id ?? null


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
        <AntdRegistry>
            <AuthLayout role={role} userId={userId}>{children}</AuthLayout>
        </AntdRegistry>
        </body>
        </html>
    );
}
