import { Awaitable, NextAuthOptions, RequestInternal } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import { connectToDatabase } from '@/lib/mongo'

export const authOptions: NextAuthOptions = {
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
                req: Pick<RequestInternal, 'body' | 'query' | 'headers' | 'method'>
            ): Promise<any> {
                const db = await connectToDatabase()
                const user = await db.collection('users').findOne({ email: credentials?.email })
                if (!user) return null

                const isValid = await bcrypt.compare(credentials!.password, user.passwordHash)
                if (!isValid) return null

                return {
                    id: user._id.toString(),
                    email: user.email,
                    role: user.isAdmin ? 'ADMIN' : 'USER',
                }
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as 'ADMIN' | 'USER' | 'LEADER' | 'ANIMATOR'
            }
            return session
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = user.role
            }
            return token
        },
    },
    pages: {
        signIn: '/', // koreňová stránka ako login
    },
    session: {
        strategy: 'jwt',
    },
    secret: process.env.NEXTAUTH_SECRET,
}
