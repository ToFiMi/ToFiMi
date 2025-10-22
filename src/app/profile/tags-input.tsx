'use client'

import { useEffect, useState, useMemo } from 'react'
import { Select, Spin, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'

interface TagOption {
    label: string | React.ReactNode
    value: string
}

const CREATE_NEW_PREFIX = '__create_new__'

export default function TagsInput({ tag_type = "allergy" }: { tag_type: string }) {
    const [options, setOptions] = useState<TagOption[]>([])
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [searchValue, setSearchValue] = useState('')

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

    // Filter options based on search and add "Create new" option if needed
    const filteredOptions = useMemo(() => {
        const trimmedSearch = searchValue.trim()

        // Filter existing options
        const filtered = options.filter(opt => {
            const labelText = typeof opt.label === 'string' ? opt.label : ''
            return labelText.toLowerCase().includes(trimmedSearch.toLowerCase())
        })

        // If there's search text and no exact match exists, add "Create new" option
        if (trimmedSearch && !options.some(opt => {
            const labelText = typeof opt.label === 'string' ? opt.label : ''
            return labelText.toLowerCase() === trimmedSearch.toLowerCase()
        })) {
            return [
                {
                    label: (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1890ff' }}>
                            <PlusOutlined />
                            <span>Vytvoriť "{trimmedSearch}"</span>
                        </div>
                    ),
                    value: `${CREATE_NEW_PREFIX}${trimmedSearch}`,
                },
                ...filtered
            ]
        }

        return filtered
    }, [searchValue, options])

    const handleSelect = async (value: string) => {
        // Check if this is a "Create new" selection
        if (value.startsWith(CREATE_NEW_PREFIX)) {
            const tagName = value.replace(CREATE_NEW_PREFIX, '')
            const tagId = await handleCreateTag(tagName)

            if (tagId) {
                const newTags = [...selectedTags, tagId]
                setSelectedTags(newTags)
                await handleChange(newTags)
            }

            setSearchValue('') // Clear the search input
        } else {
            // Regular tag selection - just clear the search
            setSearchValue('')
        }
    }

    const handleChangeWrapper = async (values: string[]) => {
        // Filter out any "create new" temporary values to prevent them from showing in tags
        const filteredValues = values.filter(v => !v.startsWith(CREATE_NEW_PREFIX))
        await handleChange(filteredValues)
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
                searchValue={searchValue}
                onSearch={setSearchValue}
                onChange={handleChangeWrapper}
                onSelect={handleSelect}
                options={filteredOptions}
                filterOption={false} // We handle filtering manually
                notFoundContent={loading ? <Spin size="small" /> : null}
                tokenSeparators={[',']} // Allow comma to separate tags
            />
        </div>
    )
}
