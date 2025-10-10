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
                const db = await connectToDatabase()

                // @ts-ignore - Handle impersonation
                if (credentials?.impersonation_token) {
                    // Verify impersonation token
                    try {
                        const jose = await import('jose')
                        const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
                        const { payload } = await jose.jwtVerify(credentials.impersonation_token, secret)

                        if (!payload.isImpersonating || !payload.originalAdminId) {
                            return null
                        }

                        // Return impersonation user data
                        return {
                            id: payload.id as string,
                            user_id: payload.user_id as string,
                            school_id: payload.school_id as string,
                            email: payload.email as string,
                            role: payload.role as 'ADMIN' | 'USER' | 'LEADER' | 'ANIMATOR',
                            isActive: payload.isActive as boolean,
                            isAdmin: false,
                            isImpersonating: true,
                            originalAdminId: payload.originalAdminId as string,
                            impersonatedUserId: payload.impersonatedUserId as string,
                            school_choices: []
                        }
                    } catch (error) {
                        console.error('Invalid impersonation token:', error)
                        return null
                    }
                }

                // @ts-ignore - Handle restoration (exit impersonation)
                if (credentials?.restoration_token) {
                    // Verify restoration token
                    try {
                        const jose = await import('jose')
                        const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
                        const { payload } = await jose.jwtVerify(credentials.restoration_token, secret)

                        // Return admin user data
                        return {
                            id: payload.id as string,
                            user_id: payload.user_id as string || null,
                            school_id: payload.school_id as string || null,
                            email: payload.email as string,
                            role: payload.role as 'ADMIN' | 'USER' | 'LEADER' | 'ANIMATOR' || null,
                            isActive: payload.isActive as boolean,
                            isAdmin: payload.isAdmin as boolean,
                            school_choices: payload.school_choices as any[] || []
                        }
                    } catch (error) {
                        console.error('Invalid restoration token:', error)
                        return null
                    }
                }

                // Regular login - require email and password
                if (!credentials?.email || !credentials.password) return null

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
        async jwt({ token, user, trigger }) {
            // Initial sign in - populate token from user object
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
                // @ts-ignore
                token.isImpersonating = user.isImpersonating ?? false
                // @ts-ignore
                token.originalAdminId = user.originalAdminId ?? null
                // @ts-ignore
                token.impersonatedUserId = user.impersonatedUserId ?? null
            } else if (token.user_id && token.school_id && !token.isImpersonating) {
                // On subsequent requests, refresh role and active status from database
                // Skip refresh for impersonating sessions to preserve original state
                try {
                    const db = await connectToDatabase()
                    const userSchool = await db.collection('user_school').findOne({
                        _id: new ObjectId(token.user_id as string)
                    })

                    if (userSchool) {
                        token.role = userSchool.role
                        token.isActive = userSchool.role !== 'inactive'
                    } else {
                        // User-school relationship no longer exists
                        token.isActive = false
                    }
                } catch (error) {
                    console.error('Error refreshing token:', error)
                }
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
                school_choices: token.school_choices ?? [],
                // @ts-ignore
                isImpersonating: token.isImpersonating ?? false,
                // @ts-ignore
                originalAdminId: token.originalAdminId,
                // @ts-ignore
                impersonatedUserId: token.impersonatedUserId
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
