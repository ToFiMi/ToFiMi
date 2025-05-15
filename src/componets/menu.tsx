"use client"
import {Button, Layout, Menu} from "antd";
import Link from "next/link";
import {signOut} from "next-auth/react";

const {Content, Sider} = Layout;
type Props = {
    role: 'ADMIN' |'user' | 'leader' | 'animator' | null | {};
}
export default function AppMenu ({role}: Props) {
    let items = [];

    const leaderItems = [
        {key: 'homework', label: <Link href="/homeworks">Domáce úlohy</Link>},
        {key: 'group', label: <Link href="/groups">Skupinky</Link>},
        {key: 'profile', label: <Link href="/profile">Môj profil</Link>},
        {key: 'registration', label: <Link href="/registration">Registrácia</Link>},
        {key: 'daily-reflections', label:<Link href="/daily-reflections">Registrácia</Link> }
    ];

    const animatorItems = [
        {key: 'homework', label: <Link href="/homeworks">Domáce úlohy</Link>},
        {key: 'events', label: <Link href="/events">Termíny</Link>},
        {key: 'profile', label: <Link href="/profile">Profil</Link>},
        {key: 'daily-reflections', label:<Link href="/daily-reflections">Registrácia</Link> }
    ];

    const studentItems = [
        {key: 'homework', label: <Link href="/my-homeworks">Domáce úlohy</Link>},
        {key: 'events', label: <Link href="/events">Termíny</Link>},
        {key: 'profile', label: <Link href="/profile">Profil</Link>},
        {key: 'daily-reflections', label:<Link href="/daily-reflections">Registrácia</Link> }
    ];
    if (role === 'leader') {
        items = leaderItems;
    } else if (role === 'animator') {
        items = animatorItems;
    } else {
        items = studentItems;
    }

    const handleLogout = async () => {
        signOut({ redirect: true, callbackUrl: '/' })
    }
    return (
        <Sider breakpoint="lg" collapsedWidth="0">
            <Menu  theme="dark" mode="inline" items={items}/>

            <Button onClick={handleLogout}> logout</Button>
        </Sider>
    )
}
