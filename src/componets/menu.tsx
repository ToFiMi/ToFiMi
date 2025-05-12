"use client"
import {Layout, Menu} from "antd";
import Link from "next/link";

const {Content, Sider} = Layout;
type Props = {
    role: 'ADMIN' | 'USER' | 'LEADER' | 'ANIMATOR' | null | {};
}
export default function ({role}: Props) {
    let items = [];

    const leaderItems = [
        {key: 'homework', label: <Link href="/homework">Domáce úlohy</Link>},
        {key: 'group', label: <Link href="/group">Moja skupina</Link>},
        {key: 'profile', label: <Link href="/profile">Môj profil</Link>},
    ];

    const animatorItems = [
        {key: 'check-homework', label: <Link href="/check-homework">Kontrola úloh</Link>},
        {key: 'my-events', label: <Link href="/my-events">Moje termíny</Link>},
        {key: 'profile', label: <Link href="/profile">Profil</Link>},
    ];

    const studentItems = [
        {key: 'events', label: <Link href="/events">Termíny</Link>},
        {key: 'profile', label: <Link href="/profile">Profil</Link>},
    ];
    if (role === 'LEADER') {
        items = leaderItems;
    } else if (role === 'ANIMATOR') {
        items = animatorItems;
    } else {
        items = studentItems;
    }
    return (
        <Sider breakpoint="lg" collapsedWidth="0">
            <Menu theme="dark" mode="inline" items={items}/>
        </Sider>
    )
}
