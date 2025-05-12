import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import { connectToDatabase } from '@/lib/mongo'


export const authOptions = {
    debug: true,
    providers: [
        CredentialsProvider({
            id: 'credentials',
            type: 'credentials',
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },

            async authorize(
                credentials: Record<'email' | 'password', string> | undefined,
            ): Promise<any> {
                const db = await connectToDatabase()

                const user = await db.collection('users').findOne({ email: credentials?.email })
                if (!user) return null

                const isValid = await bcrypt.compare(credentials!.password, user.passwordHash)
                if (!isValid) return null


                if (user.isAdmin) {
                    return {
                        id: user._id.toString(),
                        email: user.email,
                        isAdmin: true,
                        role: 'ADMIN',
                        school_id: null,
                    }
                }


                const firstSchool = await db.collection("user_school").findOne({ user_id: user._id })
                if (!firstSchool) return null

                return {
                    id: user._id.toString(),
                    email: user.email,
                    isAdmin: false,
                    role: firstSchool.role,
                    school_id: firstSchool.school_id
                }
            }
        }),
    ],
    callbacks: {

// @ts-ignore
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = user.role
                token.school_id = user.school_id ?? null
                token.isAdmin = user.isAdmin
            }
            return token
        },

// @ts-ignore
        async session({ session, token }) {
            if (session.user && token) {
                session.user.id = token.id
                session.user.role = token.role
                session.user.school_id = token.school_id
                session.user.isAdmin = token.isAdmin
            }
            return session
        }
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
    },
    secret: process.env.NEXTAUTH_SECRET,
}
