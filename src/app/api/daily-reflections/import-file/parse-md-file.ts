// src/app/api/daily-reflections/import-file/parse-md-file.ts

export function parseMarkdownReflections(content: string) {
    const lines = content.split(/\r?\n/)
    const reflections: {
        verse_reference: { reference: string; verse: string }[]
        content: string
    }[] = []

    let currentDay: { reference: string; verse: string }[] = []
    let currentContent: string[] = []
    let currentRefGroup: { reference: string; verse: string }[] = []
    let mode: 'verse' | 'verse_text' | 'content' | null = null

    const pushReflection = () => {
        if (currentRefGroup.length || currentContent.length) {
            reflections.push({
                verse_reference: currentRefGroup,
                content: currentContent.join('\n').trim(),
            })
        }
        currentRefGroup = []
        currentContent = []
    }

    for (let line of lines) {
        line = line.trim()

        if (line.startsWith('##')) {
            pushReflection()
            continue
        }

        if (line.startsWith('**Verš**')) {
            mode = 'verse'
            const ref = line.split('**Verš**:')[1]?.trim()
            if (ref) currentRefGroup.push({ reference: ref, verse: '' })
            continue
        }

        if (line.startsWith('**Text**')) {
            mode = 'verse_text'
            continue
        }

        if (line.startsWith('**Zamyslenie**')) {
            mode = 'content'
            continue
        }

        if (line.startsWith('---')) {
            pushReflection()
            continue
        }

        // append content based on mode
        if (mode === 'verse_text') {
            if (currentRefGroup.length) {
                currentRefGroup[currentRefGroup.length - 1].verse += (currentRefGroup[currentRefGroup.length - 1].verse ? '\n' : '') + line
            }
        } else if (mode === 'content') {
            currentContent.push(line)
        }
    }

    // push final
    pushReflection()

    return reflections
}
