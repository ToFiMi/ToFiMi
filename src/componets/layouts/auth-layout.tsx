'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GuestLayout } from "./guest-layout";
import { AdminLayout } from "./admin-layout";
import { UserLayout } from "./user-layout";

export function AuthLayout({ children }: { children: React.ReactNode }) {
    const [role, setRole] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        async function fetchRole() {
            try {
                const res = await fetch('/api/auth/me', { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    setRole(data.role);
                } else {
                    setRole(null); // neprihlásený
                }
            } catch (err) {
                setRole(null);
            }
        }
        fetchRole();
    }, []);

    if (role === null) {
        // User nie je prihlásený
        return <GuestLayout>{children}</GuestLayout>;
    } else if (role === "ADMIN") {
        return <AdminLayout>{children}</AdminLayout>;
    } else {
        return <UserLayout>{children}</UserLayout>;
    }
}
