// types/next-auth.d.ts
import  {DefaultSession} from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: 'ADMIN' | 'USER' | 'LEADER' | 'ANIMATOR'
            school_id?: string | null
            isAdmin?: boolean
        } & DefaultSession["user"]
    }

    interface User {
        id: string
        role: 'ADMIN' | 'USER' | 'LEADER' | 'ANIMATOR'
        school_id?: string | null
        isAdmin?: boolean
        email: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role: 'ADMIN' | 'user' | 'leader' | 'animator'
        school_id?: string | null
        isAdmin?: boolean
        email?: string
    }
}
