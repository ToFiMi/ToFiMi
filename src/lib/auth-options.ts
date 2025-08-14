import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'
import type { AuthOptions } from 'next-auth'

// @ts-ignore
export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            id: 'credentials',
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'text' },
                password: { label: 'Password', type: 'password' },
                user_school_id: { label: 'User School ID', type: 'text', optional: true },
            },
            // @ts-ignore
            async authorize(credentials) {
                if (!credentials?.email || !credentials.password) return null

                const db = await connectToDatabase()
                const user = await db.collection('users').findOne({ email: credentials.email })
                if (!user) return null

                // Validate password only when not selecting a school
                if (!credentials.user_school_id) {
                    const valid = await bcrypt.compare(credentials.password, user.passwordHash)
                    if (!valid) return null
                }

                // Only get active user-school relationships (exclude inactive users)
                const schools = await db.collection('user_school').aggregate([
                    { 
                        $match: { 
                            user_id: new ObjectId(user._id),
                            role: { $ne: 'inactive' } // Exclude inactive users
                        } 
                    },
                    {
                        $lookup: {
                            from: 'schools',
                            localField: 'school_id',
                            foreignField: '_id',
                            as: 'school'
                        }
                    },
                    { $unwind: '$school' },
                    {
                        $project: {
                            id: '$_id',
                            school_id: '$school._id',
                            school_name: '$school.name',
                            role: 1
                        }
                    }
                ]).toArray()

                // If no active schools found, deny access
                if (schools.length === 0 && !user.isAdmin) {
                    return null // User is inactive in all schools
                }

                // Admin – nezávislý od školy
                if (user.isAdmin) {
                    return {
                        id: user._id.toString(),
                        email: user.email,
                        isAdmin: true,
                        isActive: true, // Admins are always active
                        role: 'ADMIN',
                        school_choices: schools.map(s => ({
                            id: s.id.toString(),
                            school_id: s.school_id.toString(),
                            role: s.role,
                            name: s.school_name
                        }))
                    }
                }

                // Užívateľ s jednou školou → auto login
                if (schools.length === 1) {
                    return {
                        id: user._id.toString(),
                        user_id: schools[0].id.toString(),
                        school_id: schools[0].school_id.toString(),
                        email: user.email,
                        role: schools[0].role,
                        isActive: true, // User is active since we filtered out inactive
                        isAdmin: false
                    }
                }

                // Viac škôl → výber konkrétnej
                if (credentials.user_school_id) {
                    const selected = schools.find(s => s.id.toString() === credentials.user_school_id)
                    if (!selected) return null

                    return {
                        id: user._id.toString(),
                        user_id: selected.id.toString(),
                        school_id: selected.school_id.toString(),
                        email: user.email,
                        role: selected.role,
                        isActive: true, // User is active since we filtered out inactive
                        isAdmin: false
                    }
                }

                // Výber školy bude nasledovať
                return {
                    id: user._id.toString(),
                    email: user.email,
                    isAdmin: false,
                    role: null,
                    school_choices: schools.map(s => ({
                        id: s.id.toString(),
                        school_id: s.school_id.toString(),
                        role: s.role,
                        name: s.school_name
                    }))
                }
            }
        })
    ],
    session: {
        strategy: 'jwt'
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.email = user.email
                token.isAdmin = user.isAdmin
                // @ts-ignore
                token.isActive = user.isActive ?? true
                // @ts-ignore
                token.role = user.role ?? null
                token.user_id = user.user_id ?? null
                token.school_id = user.school_id ?? null
                token.school_choices = user.school_choices ?? []
            }
            return token
        },
        //@ts-ignore
        async session({ session, token }) {
            // @ts-ignore
            session.user = {
                id: token.id,
                email: token.email,
                isAdmin: token.isAdmin,
                // @ts-ignore
                isActive: token.isActive,
                user_id: token.user_id,
                school_id: token.school_id,
                // @ts-ignore
                role: token.role,
                // @ts-ignore
                school_choices: token.school_choices ?? []
            }
            return session
        }
    },
    pages: {
        signIn: '/login'
    },
    secret: process.env.NEXTAUTH_SECRET,
    // @ts-ignore
    trustHost: true
}
