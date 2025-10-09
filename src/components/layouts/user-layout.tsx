'use client'

import {ReactNode} from 'react';
import Menu from "@/components/menu";
import { SocketProvider } from '@/hooks/socket-provider';
import { SessionProvider } from 'next-auth/react';



export default function UserLayout({
                                             children,
                                             userId,
                                         }: {
    children: ReactNode;
    userId: string | null | {};
}) {


    return <SessionProvider>
        <Menu>
            <SocketProvider url={process.env.NEXT_PUBLIC_SOCKET_URL!}>
                {children}
            </SocketProvider>
        </Menu>
    </SessionProvider>
}

