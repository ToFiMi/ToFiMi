'use client';

import { Menu } from 'antd';
import {
    HomeOutlined,
    TeamOutlined,
    AppstoreOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type MenuItem = Required<MenuProps>['items'][number];

const menuItems: MenuItem[] = [
    {
        key: 'dashboard',
        icon: <HomeOutlined />,
        label: <Link href="/admin/dashboard">Dashboard</Link>,
    },
    {
        key: 'schools',
        icon: <AppstoreOutlined />,
        label: <Link href="/admin/schools">Schools</Link>,
    },
    {
        key: 'users',
        icon: <TeamOutlined />,
        label: <Link href="/admin/users">Users</Link>,
    },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const selectedKey = pathname.split('/')[2] || 'dashboard';

    return (
        <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
        />
    );
}
