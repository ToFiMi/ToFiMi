import { Layout } from 'antd';
import { ReactNode } from 'react';
import Menu from "@/componets/menu";


export default async function UserLayout({
                                     children,
                                     role,
                                     userId,
                                 }: {
    children: ReactNode;
    role: 'ADMIN' | 'USER' | 'LEADER' | 'ANIMATOR' | null | {};
    userId: string | null | {};
}) {




    return (
        <Layout hasSider  style={{ minHeight: '100vh' }}>
           <Menu role={role}/>
            <Layout>
                <main style={{ margin: '24px 16px 0' }}>
                    <div style={{ padding: 24, minHeight: 360 }}>{children}</div>
                </main>
            </Layout>
        </Layout>
    );
}
