'use client'

import { useEffect, useState } from 'react'
import { Select, Spin, message } from 'antd'

interface TagOption {
    label: string
    value: string
}

export default function TagsInput({ tag_type = "allergy" }: { tag_type: string }) {
    const [options, setOptions] = useState<TagOption[]>([])
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [loading, setLoading] = useState(false)

    const fetchTags = async () => {
        try {
            const res = await fetch(`/api/tags?type=${tag_type}`)
            const data = await res.json()
            setOptions(data.map((tag: any) => ({ label: tag.name, value: tag._id })))
        } catch (err) {
            console.error(err)
            message.error('Nepodarilo sa načítať tagy')
        }
    }

    const fetchUserTags = async () => {
        try {
            const res = await fetch(`/api/user_tags/`)
            const data = await res.json()
            setSelectedTags(data.map((t: any) => t.tag_id))
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => {
        fetchTags()
        fetchUserTags()
    }, [])

    const handleChange = async (values: string[]) => {
        setSelectedTags(values)
        setLoading(true)
        try {
            const res = await fetch('/api/user_tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({  tags: values })
            })
            if (!res.ok) throw new Error()
            message.success('Tagy aktualizované')
        } catch (err) {
            message.error('Nepodarilo sa uložiť tagy')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateTag = async (tagName: string) => {
        try {
            const res = await fetch('/api/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: tagName, type: tag_type })
            })
            const newTag = await res.json()
            const newOption = { label: newTag.name, value: newTag._id }
            setOptions([...options, newOption])
            return newOption.value
        } catch (err) {
            message.error('Nepodarilo sa vytvoriť nový tag')
        }
    }

    return (
        <div>
            <label className="block font-medium mb-2">Alergie a intolerancie</label>
            <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="Vyber alebo napíš alergiu"
                value={selectedTags}
                loading={loading}
                onChange={handleChange}
                onSearch={fetchTags}
                onSelect={fetchTags}
                options={options}
                notFoundContent={loading ? <Spin size="small" /> : null}
                onBlur={fetchTags}
                onInputKeyDown={async (e: any) => {
                    if (e.key === 'Enter' && e.target.value) {
                        const tagId = await handleCreateTag(e.target.value)
                        if (tagId) {
                            const newTags = [...selectedTags, tagId]
                            setSelectedTags(newTags)
                            await handleChange(newTags)
                        }
                    }
                }}
            />
        </div>
    )
}
