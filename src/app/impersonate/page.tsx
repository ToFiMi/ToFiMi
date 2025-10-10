'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { signIn, signOut } from 'next-auth/react'
import { Spin, Result } from 'antd'

export default function ImpersonatePage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const processImpersonation = async () => {
            const token = searchParams.get('token')

            if (!token) {
                setError('Missing impersonation token')
                setLoading(false)
                return
            }

            try {
                // First, sign out any existing session
                await signOut({ redirect: false })

                // Wait a bit for signout to complete
                await new Promise(resolve => setTimeout(resolve, 500))

                // Use the custom provider to handle impersonation login
                // The token will be verified server-side in the authorize function
                const result = await signIn('credentials', {
                    redirect: false,
                    email: '__IMPERSONATION__', // Dummy email, will be ignored
                    password: '__IMPERSONATION__', // Dummy password, will be ignored
                    impersonation_token: token
                })

                if (result?.error) {
                    setError('Failed to establish impersonation session: ' + result.error)
                    setLoading(false)
                    return
                }

                // Success - redirect to dashboard
                router.push('/dashboard')

            } catch (error) {
                console.error('Impersonation error:', error)
                setError('Failed to process impersonation token: ' + (error as Error).message)
                setLoading(false)
            }
        }

        processImpersonation()
    }, [searchParams, router])

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" tip="Setting up impersonation session..." />
            </div>
        )
    }

    if (error) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Result
                    status="error"
                    title="Impersonation Failed"
                    subTitle={error}
                />
            </div>
        )
    }

    return null
}
