
import "./globals.css";
import { PwaInit } from "@/app/pwa-init";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import  AuthLayout  from "@/components/layouts/auth-layout";
import '@ant-design/v5-patch-for-react-19';
import { ConfigProvider } from 'antd'
import sk from 'antd/locale/sk_SK'
import {cookies} from "next/headers";
import {getToken} from "next-auth/jwt";
import dayjs from 'dayjs'
import 'dayjs/locale/sk'
import localeData from 'dayjs/plugin/localeData'

dayjs.extend(localeData)
dayjs.locale({
    ...dayjs.Ls.sk,
    weekStart: 1
})
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
            <link rel="icon" href="/public/icon.ico" sizes="any" />
            <meta name="theme-color" content="#ffffff" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            <meta name="apple-mobile-web-app-title" content="Das app" />
            <link rel="apple-touch-icon" href="/public/icon-192x192.png" />
        </head>
        <body>
        <PwaInit />
        <ConfigProvider locale={sk}>
        <AntdRegistry>
            <AuthLayout role={role} userId={userId}>{children}</AuthLayout>
        </AntdRegistry>
        </ConfigProvider>
        </body>
        </html>
    );
}
