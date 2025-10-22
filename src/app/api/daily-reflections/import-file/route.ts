import {NextRequest, NextResponse} from 'next/server'
import {connectToDatabase} from '@/lib/mongo'
import {ObjectId} from 'mongodb'
import {parse} from 'csv-parse/sync'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import {getToken} from "next-auth/jwt";
import {parseMarkdownReflections} from "@/app/api/daily-reflections/import-file/parse-md-file";
import {DailyReflection} from "@/models/daliy-reflections";
import {Event} from "@/models/events";

export async function POST(req: NextRequest) {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const event_id = formData.get('event_id') as string
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const created_by = token.id

    if (!file || !event_id || !created_by) {
        return new NextResponse('Missing required fields', { status: 400 })
    }

    const db = await connectToDatabase()

    const extension = file.name.split('.').pop()?.toLowerCase()
    const buffer = Buffer.from(await file.arrayBuffer())
    let reflections: { verse_reference: { reference: string; verse: string }[]; content: string; date?: string }[] = []

    if (extension === 'csv') {
        const records = parse(buffer.toString(), {
            columns: true,
            skip_empty_lines: true,
        })

        reflections = records
            .filter((row: any) => row['reference'] && row['verse'] && row['content'])
            .map((row: any) => ({
                verse_reference: [
                    {
                        reference: row['reference']?.trim(),
                        verse: row['verse']?.trim(),
                    },
                ],
                content: row['content']?.trim(),
                date: row['date']?.trim(),
            }))
    } else if (extension === 'xlsx') {
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(sheet)

        reflections = (data as any[])
            .filter((row) => row['reference'] && row['verse'] && row['content'])
            .map((row) => ({
                verse_reference: [
                    {
                        reference: row['reference']?.toString()?.trim(),
                        verse: row['verse']?.toString()?.trim(),
                    },
                ],
                content: row['content']?.toString()?.trim(),
                date: row['date']?.toString()?.trim(),
            }))
    } else if (extension === 'md') {
        const content = buffer.toString()
        reflections = parseMarkdownReflections(content)
    } else {
        return new NextResponse('Unsupported file type', { status: 400 })
    }

    if (reflections.length === 0) {
        return new NextResponse('No valid reflections found in file', { status: 400 })
    }

    const event = await db.collection<Event>('events').findOne({ _id: new ObjectId(event_id) })
    if (!event) return new NextResponse('Event not found', { status: 404 })

    const documents = reflections.map((r, index) => {
        // Use date from CSV if provided, otherwise fallback to calculating from event end date
        let date: Date
        if (r.date) {
            // Parse date string as local date at midnight to avoid timezone issues
            date = dayjs(r.date).startOf('day').toDate()
        } else {
            const baseDate = dayjs(event.endDate).add(1, 'day')
            date = baseDate.add(index, 'day').startOf('day').toDate()
        }

        return {
            event_id: new ObjectId(event_id),
            date,
            school_id: new ObjectId(event.school_id),
            verse_reference: r.verse_reference,
            content: r.content,
            created_by: new ObjectId(created_by),
            created: new Date(),
        }
    })

    await db.collection<DailyReflection>('daily_reflections').insertMany(documents)

    return NextResponse.json({ inserted: documents.length })
}
