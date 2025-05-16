import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import {connectToDatabase} from '@/lib/mongo'
import {ObjectId} from "mongodb";


export const authOptions = {
    debug: true,
    providers: [
        CredentialsProvider({
            id: 'credentials',
            type: 'credentials',
            name: 'Credentials',
            credentials: {
                email: {label: 'Email', type: 'text'},
                password: {label: 'Password', type: 'password'},
                user_school_id: {label: 'User School ID', type: 'text', optional: true},
            },

            async authorize(
                credentials: Record<'email' | 'password' | 'user_school_id', string> | undefined,
            ): Promise<any> {
                const db = await connectToDatabase()

                const user = await db.collection('users').findOne({email: credentials?.email})
                if (!user) return null

                if (!credentials?.user_school_id) {
                    const isValid = await bcrypt.compare(credentials!.password, user.passwordHash)
                    if (!isValid) return null
                }
                const schools = await db.collection("user_school").aggregate([
                    {
                        $match: {
                            user_id: new ObjectId(user._id)
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
                    {$unwind: '$school'},
                    {
                        $project: {
                            id: '$_id', // ID z kolekcie user_school
                            school_id: '$school._id',
                            school_name: '$school.name',
                            role: 1
                        }
                    }
                ]).toArray()

                if (user.isAdmin) {
                    return {
                        id: user._id.toString(),
                        email: user.email,
                        isAdmin: true,
                        role: 'ADMIN',
                        school_choices: schools.map(s => ({
                            id: s._id.toString(),
                            school_id: s.school_id.toString(),
                            role: s.role,
                            name: s.school_name
                        }))
                    }
                }

                if (schools.length === 1) {
                    return {
                        id: user._id.toString(),
                        user_id: schools[0]._id.toString(),
                        school_id: schools[0].school_id.toString(),
                        email: user.email,
                        role: schools[0].role,
                        isAdmin: false
                    }
                }
                if (credentials?.user_school_id) {
                    const selected = schools.find(s => s._id.toString() === credentials.user_school_id)
                    if (!selected) return null

                    return {
                        id: user._id.toString(),
                        user_id: selected._id.toString(),
                        school_id: selected.school_id.toString(),
                        email: user.email,
                        role: selected.role,
                        isAdmin: false
                    }
                }

                return {
                    id: user._id.toString(),
                    email: user.email,
                    isAdmin: false,
                    role: null,
                    school_choices: schools.map(s => ({
                        id: s._id.toString(),
                        school_id: s.school_id.toString(),
                        role: s.role,
                        name: s.school_name
                    }))
                }

            }
        }),
    ],
    callbacks: {

// @ts-ignore
        async jwt({token, user}) {
            if (user) {
                token.id = user.id
                token.email = user.email
                token.isAdmin = user.isAdmin
                token.school_choices = user.school_choices || []
                token.school_id = user.school_id ?? null
                token.user_id = user.user_id ?? null
                token.role = user.role ?? null
            }
            return token
        },

// @ts-ignore
        async session({session, token}) {
            session.user = {
                id: token.id,
                email: token.email,
                isAdmin: token.isAdmin,
                user_id: token.user_id,
                school_id: token.school_id,
                role: token.role,
                school_choices: token.school_choices || []
            }
            return session
        }
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
    }, useSecureCookies: false,
    trustHost: true,

    secret: process.env.NEXTAUTH_SECRET,

}


// const schools = await db.collection("user_school")
//     .find({ user_id: user._id })
//     .toArray()
//
// if (!schools.length) return null
//
// return {
//     id: user._id.toString(),
//     email: user.email,
//     isAdmin: false,
//     role: null,
//     school_id: null,
//     schools: schools.map(s => ({
//         _id: s._id.toString(),
//         school_id: s.school_id.toString(),
//         role: s.role
//     }))
// }


//
// async jwt({ token, user }) {
//     if (user) {
//         token.id = user.id
//         token.user_id = user.user_id
//         token.role = user.role
//         token.school_id = user.school_id ?? null
//         token.isAdmin = user.isAdmin
//         token.schools = user.schools ?? [] // <-- uložíme dostupné školy
//     }
//     return token
// }

// async session({ session, token }) {
//     if (session.user && token) {
//         session.user.id = token.id
//         session.user.user_id = token.user_id
//         session.user.role = token.role
//         session.user.school_id = token.school_id
//         session.user.isAdmin = token.isAdmin
//         session.user.schools = token.schools
//     }
//     return session
// }
