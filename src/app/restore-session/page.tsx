'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { signIn, signOut } from 'next-auth/react'
import { Spin, Result } from 'antd'

export default function RestoreSessionPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const restoreSession = async () => {
            const token = searchParams.get('token')

            if (!token) {
                setError('Missing restoration token')
                setLoading(false)
                return
            }

            try {
                // First sign out from impersonated session
                await signOut({ redirect: false })

                // Wait a bit for signout to complete
                await new Promise(resolve => setTimeout(resolve, 500))

                // Sign in with admin credentials
                // The token will be verified server-side in the authorize function
                const result = await signIn('credentials', {
                    redirect: false,
                    email: '__RESTORATION__', // Dummy email, will be ignored
                    password: '__RESTORATION__', // Dummy password, will be ignored
                    restoration_token: token
                })

                if (result?.error) {
                    setError('Failed to restore admin session: ' + result.error)
                    setLoading(false)
                    return
                }

                // Success - redirect to dashboard
                router.push('/dashboard')

            } catch (error) {
                console.error('Session restoration error:', error)
                setError('Failed to process restoration token: ' + (error as Error).message)
                setLoading(false)
            }
        }

        restoreSession()
    }, [searchParams, router])

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" tip="Restoring admin session..." />
            </div>
        )
    }

    if (error) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Result
                    status="error"
                    title="Session Restoration Failed"
                    subTitle={error}
                />
            </div>
        )
    }

    return null
}
