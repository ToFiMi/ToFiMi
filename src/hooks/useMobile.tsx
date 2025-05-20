'use client'

import { useEffect, useState } from 'react'

export function useMobile(breakpoint = 768): boolean {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < breakpoint)

        check() // inicializácia
        window.addEventListener('resize', check)

        return () => window.removeEventListener('resize', check)
    }, [breakpoint])

    return isMobile
}
