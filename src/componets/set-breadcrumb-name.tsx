'use client'

import { useEffect } from 'react'

interface Props {
    id: string
    name: string
}

export default function SetBreadcrumbName({ id, name }: Props) {
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.app = window.app || {}
            window.app.callback = window.app.callback || {}
            window.app.callback.path = window.app.callback.path || {}

            window.app.callback.path[id] = { id, name }
        }
    }, [id, name])

    return null
}
