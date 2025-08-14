import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'

export interface AuthContext {
    userId: string
    userSchoolId: string
    schoolId: string
    role: 'ADMIN' | 'leader' | 'animator' | 'user'
    isAdmin: boolean
    isActive: boolean
    email: string
}

/**
 * Validates JWT token and checks if user is active
 * Returns null if unauthorized or inactive
 */
export async function getAuthContext(req: NextRequest): Promise<AuthContext | null> {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token) {
        return null
    }

    // Check if user is active
    if (token.isActive === false) {
        console.log(`API access denied for inactive user: ${token.email}`)
        return null
    }

    // Ensure required fields are present
    if (!token.id || !token.role) {
        return null
    }

    return {
        userId: token.id as string,
        userSchoolId: token.user_id as string,
        schoolId: token.school_id as string,
        role: token.role as 'ADMIN' | 'leader' | 'animator' | 'user',
        isAdmin: token.isAdmin as boolean,
        isActive: token.isActive !== false,
        email: token.email as string
    }
}

/**
 * Middleware helper for API routes requiring authentication
 * Returns 401 if not authenticated or inactive
 */
export async function requireAuth(
    req: NextRequest,
    allowedRoles?: ('ADMIN' | 'leader' | 'animator' | 'user')[]
): Promise<{ auth: AuthContext } | NextResponse> {
    const auth = await getAuthContext(req)
    
    if (!auth) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    if (allowedRoles && !allowedRoles.includes(auth.role)) {
        return new NextResponse('Forbidden - insufficient permissions', { status: 403 })
    }

    return { auth }
}

/**
 * Re-validates user's active status against database
 * Use this for sensitive operations to ensure user hasn't been deactivated
 */
export async function validateActiveStatus(userId: string, schoolId?: string): Promise<boolean> {
    try {
        const db = await connectToDatabase()
        
        const query: any = {
            user_id: new ObjectId(userId),
            role: { $ne: 'inactive' }
        }

        if (schoolId) {
            query.school_id = new ObjectId(schoolId)
        }

        const activeUserSchool = await db.collection('user_school').findOne(query)
        
        return !!activeUserSchool
    } catch (error) {
        console.error('Error validating user active status:', error)
        return false
    }
}

/**
 * Enhanced auth check that also validates against database
 * Use for critical operations
 */
export async function requireActiveAuth(
    req: NextRequest,
    allowedRoles?: ('ADMIN' | 'leader' | 'animator' | 'user')[]
): Promise<{ auth: AuthContext } | NextResponse> {
    const authResult = await requireAuth(req, allowedRoles)
    
    if (authResult instanceof NextResponse) {
        return authResult // Return error response
    }

    const { auth } = authResult
    
    // Double-check active status against database for admins and critical operations
    if (!auth.isAdmin && auth.schoolId) {
        const isActive = await validateActiveStatus(auth.userId, auth.schoolId)
        if (!isActive) {
            console.log(`Database check: User ${auth.email} is no longer active`)
            return new NextResponse('User account is inactive', { status: 403 })
        }
    }

    return { auth }
}