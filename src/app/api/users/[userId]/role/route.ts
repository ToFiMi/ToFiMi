import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'
import { requireAuth } from '@/lib/auth-helpers'

export async function PUT(
    req: NextRequest,
    { params }: { params: { userId: string } }
) {
    const authResult = await requireAuth(req, ['ADMIN', 'leader'])
    if (authResult instanceof NextResponse) return authResult

    const { auth } = authResult
    const { userId } = params

    if (!ObjectId.isValid(userId)) {
        return new NextResponse('Invalid user ID', { status: 400 })
    }

    const db = await connectToDatabase()

    try {
        const { newRole } = await req.json()

        // Validate role
        const allowedRoles = ['user', 'animator', 'leader', 'inactive']
        if (!allowedRoles.includes(newRole)) {
            return new NextResponse('Invalid role', { status: 400 })
        }

        // Role change permissions
        if (auth.role === 'leader') {
            // Leaders can only manage users and animators in their school
            if (newRole === 'leader') {
                return new NextResponse('Leaders cannot assign leader role', { status: 403 })
            }
            
            // Verify the target user belongs to the same school
            const targetUserSchool = await db.collection('user_school').findOne({
                user_id: new ObjectId(userId),
                school_id: new ObjectId(auth.schoolId)
            })

            if (!targetUserSchool) {
                return new NextResponse('User not found in your school', { status: 404 })
            }

            // Leaders cannot demote other leaders
            if (targetUserSchool.role === 'leader') {
                return new NextResponse('Cannot change role of another leader', { status: 403 })
            }
        }

        // For admins, they can change roles across schools or need school_id in request
        let updateQuery: any = { user_id: new ObjectId(userId) }
        if (!auth.isAdmin) {
            updateQuery.school_id = new ObjectId(auth.schoolId)
        } else if (req.nextUrl.searchParams.get('school_id')) {
            updateQuery.school_id = new ObjectId(req.nextUrl.searchParams.get('school_id')!)
        }

        // Update the user role
        const result = await db.collection('user_school').updateOne(
            updateQuery,
            {
                $set: {
                    role: newRole,
                    updated: new Date(),
                    updated_by: new ObjectId(auth.userId)
                }
            }
        )

        if (result.matchedCount === 0) {
            return new NextResponse('User not found', { status: 404 })
        }

        // Log the role change
        await db.collection('role_changes').insertOne({
            user_id: new ObjectId(userId),
            school_id: updateQuery.school_id,
            old_role: null, // Could fetch this if needed
            new_role: newRole,
            changed_by: new ObjectId(auth.userId),
            changed_at: new Date(),
            reason: `Role changed by ${auth.role}`
        })

        return NextResponse.json({ 
            success: true, 
            message: `User role updated to ${newRole}`,
            newRole 
        })

    } catch (error) {
        console.error('Error updating user role:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}

// Get user's current role and permissions
export async function GET(
    req: NextRequest,
    { params }: { params: { userId: string } }
) {
    const authResult = await requireAuth(req, ['ADMIN', 'leader', 'animator'])
    if (authResult instanceof NextResponse) return authResult

    const { auth } = authResult
    const { userId } = params

    if (!ObjectId.isValid(userId)) {
        return new NextResponse('Invalid user ID', { status: 400 })
    }

    const db = await connectToDatabase()

    try {
        const query: any = { user_id: new ObjectId(userId) }
        
        // Non-admins can only see users in their school
        if (!auth.isAdmin) {
            query.school_id = new ObjectId(auth.schoolId)
        }

        const userSchool = await db.collection('user_school').findOne(query)

        if (!userSchool) {
            return new NextResponse('User not found', { status: 404 })
        }

        // Determine what roles the current user can assign
        let assignableRoles: string[] = []
        
        if (auth.role === 'ADMIN') {
            assignableRoles = ['user', 'animator', 'leader', 'inactive']
        } else if (auth.role === 'leader') {
            assignableRoles = ['user', 'animator', 'inactive']
        }

        return NextResponse.json({
            currentRole: userSchool.role,
            assignableRoles,
            canChangeRole: assignableRoles.length > 0,
            permissions: {
                canActivate: userSchool.role === 'inactive',
                canDeactivate: userSchool.role !== 'inactive'
            }
        })

    } catch (error) {
        console.error('Error fetching user role info:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}