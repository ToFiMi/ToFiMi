import { connectToDatabase } from '../src/lib/mongo'
import { ObjectId } from 'mongodb'

/**
 * This script fixes homework type IDs in events that have duplicates.
 * It can be run with an event ID parameter or find all events with duplicate homework_type_ids.
 *
 * Usage:
 *   npx tsx scripts/fix-homework-ids.ts [eventId]
 */

async function fixHomeworkIds(targetEventId?: string) {
    try {
        const db = await connectToDatabase()

        let eventsToFix: any[] = []

        if (targetEventId) {
            // Fix specific event
            const event = await db.collection('events').findOne({
                _id: new ObjectId(targetEventId)
            })

            if (!event) {
                console.log('❌ Event not found!')
                return
            }
            eventsToFix = [event]
        } else {
            // Find all events with duplicate homework_type_ids
            console.log('🔍 Searching for all events with duplicate homework_type_ids...\n')
            const allEvents = await db.collection('events').find({}).toArray()

            eventsToFix = allEvents.filter((event: any) => {
                if (!event.homeworkTypes || event.homeworkTypes.length === 0) return false
                const ids = event.homeworkTypes.map((hw: any) => hw.id)
                const uniqueIds = new Set(ids)
                return ids.length !== uniqueIds.size
            })

            console.log(`Found ${eventsToFix.length} events with duplicate homework_type_ids\n`)
        }

        if (eventsToFix.length === 0) {
            console.log('✅ No events with duplicate homework_type_ids found!')
            process.exit(0)
            return
        }

        // Fix each event
        for (const event of eventsToFix) {
            console.log('─'.repeat(60))
            console.log(`📅 Event: ${event.title} (ID: ${event._id})`)
            console.log('─'.repeat(60))

            const ids = event.homeworkTypes?.map((hw: any) => hw.id) || []
            const duplicates = ids.filter((id: string, index: number) => ids.indexOf(id) !== index)

            console.log('Current homework types:')
            event.homeworkTypes.forEach((hw: any, i: number) => {
                console.log(`  ${i + 1}. ${hw.name} (id: ${hw.id})`)
            })

            console.log(`\n⚠️  Duplicate IDs: ${[...new Set(duplicates)].join(', ')}`)

            // Generate unique IDs
            const fixedHomeworkTypes = event.homeworkTypes.map((hw: any, index: number) => {
                const count = event.homeworkTypes
                    .slice(0, index)
                    .filter((h: any) => h.id === hw.id).length

                if (count > 0) {
                    const newId = `${hw.id}-${count + 1}`
                    console.log(`  ✏️  Renaming "${hw.name}" from "${hw.id}" to "${newId}"`)
                    return {
                        ...hw,
                        id: newId
                    }
                }
                return hw
            })

            // Update the event
            const result = await db.collection('events').updateOne(
                { _id: new ObjectId(event._id) },
                { $set: { homeworkTypes: fixedHomeworkTypes, updated: new Date() } }
            )

            if (result.modifiedCount > 0) {
                console.log(`✅ Event updated successfully!\n`)
            } else {
                console.log(`⚠️  No changes made (might already be fixed)\n`)
            }
        }

        console.log('═'.repeat(60))
        console.log('🎉 All events processed successfully!')
        console.log('═'.repeat(60))

        process.exit(0)
    } catch (error) {
        console.error('❌ Error:', error)
        process.exit(1)
    }
}

// Get event ID from command line args
const eventId = process.argv[2]
fixHomeworkIds(eventId)
