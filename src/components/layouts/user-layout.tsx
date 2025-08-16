import {ReactNode} from 'react';
import Menu from "@/components/menu";
import { SocketProvider } from '@/hooks/socket-provider';



export default async function UserLayout({
                                             children,
                                             role,
                                             userId,
                                         }: {
    children: ReactNode;
    role: 'ADMIN' | 'user' | 'leader' | 'animator' | null | {};
    userId: string | null | {};
}) {


    return <Menu role={role}>
        <SocketProvider url={process.env.NEXT_PUBLIC_SOCKET_URL!}>
            {children}
        </SocketProvider>



    </Menu>
}

