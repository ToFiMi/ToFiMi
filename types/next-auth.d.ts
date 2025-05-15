// types/next-auth.d.ts
import  {DefaultSession} from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            user_id: string|null
            role: 'admin' | 'user' | 'leader' | 'animator'
            school_id?: string | null
            isAdmin?: boolean
            school_choices: any[]
        } & DefaultSession["user"]
    }

    interface User {
        id: string
        user_id: string|null
        role: 'ADMIN' | 'USER' | 'LEADER' | 'ANIMATOR'
        school_id?: string | null
        isAdmin?: boolean
        email: string
        school_choices: any[]
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        user_id: string|null
        role: 'ADMIN' | 'user' | 'leader' | 'animator'
        school_id?: string | null
        isAdmin?: boolean
        email?: string
    }
}
