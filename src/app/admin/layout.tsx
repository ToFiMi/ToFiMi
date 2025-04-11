import { ReactNode } from 'react';
import { Layout } from 'antd';
import AdminSidebar from './_components/admin-sidebar';
import {Content, Header} from "antd/es/layout/layout";
import Sider from 'antd/es/layout/Sider';



export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider>
                <AdminSidebar /> {/* this is now a client component */}
            </Sider>
            <Layout>
                <Header className="bg-white px-7 shadow-md text-right">

                </Header>
                <Content className="p-6">{children}</Content>
            </Layout>
        </Layout>
    );
}
