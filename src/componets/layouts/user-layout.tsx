import { Layout } from 'antd';
import { ReactNode } from 'react';
import Menu from "@/componets/menu";


export default async function UserLayout({
                                     children,
                                     role,
                                     userId,
                                 }: {
    children: ReactNode;
    role: 'ADMIN' | 'user' | 'leader' | 'animator' | null | {};
    userId: string | null | {};
}) {


    return <Menu role={role}>{children}</Menu>
}

