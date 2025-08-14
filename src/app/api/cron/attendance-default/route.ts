import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'

// This endpoint can be called by a cron job to automatically set attendance
// for users who were registered and going to events that have ended
export async function POST(req: NextRequest) {
    try {
        // Verify this is called from a cron job (you might want to add authentication)
        const authHeader = req.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const db = await connectToDatabase()
        const now = new Date()

        // Find all events that have ended in the last 24 hours
        const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000))
        
        const recentlyEndedEvents = await db.collection('events')
            .find({
                endDate: {
                    $gte: oneDayAgo,
                    $lt: now
                }
            })
            .toArray()

        let totalUpdated = 0

        for (const event of recentlyEndedEvents) {
            // Update registrations where user was going but attendance not yet marked
            const result = await db.collection('registrations').updateMany(
                {
                    event_id: event._id,
                    going: true,
                    attended: { $exists: false } // Only update if not already marked
                },
                {
                    $set: {
                        attended: true, // Default to attended for registered users
                        attendance_marked_by: null, // Mark as auto-set (not manually set)
                        attendance_marked_at: now,
                        updated: now
                    }
                }
            )

            totalUpdated += result.modifiedCount
        }

        console.log(`Auto-attendance job: Updated ${totalUpdated} registrations for ${recentlyEndedEvents.length} events`)

        return NextResponse.json({
            success: true,
            eventsProcessed: recentlyEndedEvents.length,
            registrationsUpdated: totalUpdated,
            message: 'Default attendance set for recently ended events'
        })
    } catch (error) {
        console.error('Error in auto-attendance job:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}

// GET endpoint for manual triggering (for testing)
export async function GET(req: NextRequest) {
    // You can call this manually for testing
    return POST(req)
}