'use client'

import { AdminLayout } from './admin-layout'
import  UserLayout  from "./user-layout"
import { GuestLayout } from './guest-layout'

type Props = {
    children: React.ReactNode
    role:  'ADMIN' | 'user' | 'leader' | 'animator'| null | {},
    userId: string| null | {}
}



export default function AuthLayout({ children, role, userId }: Props) {



    if (!role || !userId) {
        return <GuestLayout>{children}</GuestLayout>
    }


    return <UserLayout userId={userId}>{children}</UserLayout>
}
