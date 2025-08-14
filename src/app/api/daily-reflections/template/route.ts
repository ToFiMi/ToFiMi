import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') || 'csv'
    const days = parseInt(searchParams.get('days') || '7')

    if (format === 'csv') {
        // Create CSV template with sample data
        const csvContent = [
            'reference,verse,content,date',
            '"Rim 1:11-12","Lebo túžim vidieť vás a dať vám nejaký duchovný dar na vašu posilu, to jest, aby sme sa navzájom potešili spoločnou vierou, vašou i mojou.","Spoločenstvo je miestom posily. Aj Pavol túžil po blízkosti druhých kresťanov. Dnes sa povzbuďme v tom, že viera nie je súkromná vec.","2025-02-03"',
            '"Jn 15:5","Ja som vinič, vy ste ratolesti. Kto zostáva vo mne a ja v ňom, prináša veľa ovocia, lebo bez mňa nemôžete robiť nič.","Zostávanie v Kristovi je základom našej duchovnej produktivity. Ako ratolesť potrebuje vinič, tak my potrebujeme Krista.","2025-02-04"'
        ]

        // Add empty rows for user to fill
        const today = new Date()
        for (let i = 2; i < days; i++) {
            const date = new Date(today)
            date.setDate(date.getDate() + i)
            const dateStr = date.toISOString().split('T')[0]
            csvContent.push(`"","","","${dateStr}"`)
        }

        const response = new NextResponse(csvContent.join('\n'))
        response.headers.set('Content-Type', 'text/csv')
        response.headers.set('Content-Disposition', `attachment; filename="daily-reflections-template.csv"`)
        return response
    }

    if (format === 'xlsx') {
        // For XLSX, we'll create a simple structure
        const jsonTemplate = [
            {
                reference: 'Rim 1:11-12',
                verse: 'Lebo túžim vidieť vás a dať vám nejaký duchovný dar na vašu posilu...',
                content: 'Spoločenstvo je miestom posily. Aj Pavol túžil po blízkosti druhých kresťanov...',
                date: '2025-02-03'
            },
            {
                reference: 'Jn 15:5',
                verse: 'Ja som vinič, vy ste ratolesti. Kto zostáva vo mne a ja v ňom...',
                content: 'Zostávanie v Kristovi je základom našej duchovnej produktivity...',
                date: '2025-02-04'
            }
        ]

        // Add empty rows
        const today = new Date()
        for (let i = 2; i < days; i++) {
            const date = new Date(today)
            date.setDate(date.getDate() + i)
            const dateStr = date.toISOString().split('T')[0]
            jsonTemplate.push({
                reference: '',
                verse: '',
                content: '',
                date: dateStr
            })
        }

        return NextResponse.json({
            template: jsonTemplate,
            instructions: {
                reference: 'Bible reference (e.g., Rim 1:11-12)',
                verse: 'Full text of the verse',
                content: 'Your reflection content',
                date: 'Date in YYYY-MM-DD format'
            }
        })
    }

    return new NextResponse('Invalid format', { status: 400 })
}