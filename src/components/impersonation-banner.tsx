'use client'

import { useSession } from 'next-auth/react'
import { Alert, Button } from 'antd'
import { LogoutOutlined, EyeOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ImpersonationBanner() {
    const { data: session } = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    if (!session?.user?.isImpersonating) {
        return null
    }

    const handleExitImpersonation = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/admin/stop-impersonate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (response.ok) {
                const data = await response.json()
                // Redirect to the URL that will restore admin session
                window.location.href = data.redirectUrl || '/dashboard'
            } else {
                console.error('Failed to stop impersonation')
                alert('Failed to exit impersonation mode')
                setLoading(false)
            }
        } catch (error) {
            console.error('Error stopping impersonation:', error)
            alert('Error exiting impersonation mode')
            setLoading(false)
        }
    }

    return (
        <Alert
            message={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>
                        <EyeOutlined style={{ marginRight: 8 }} />
                        <strong>Impersonation Mode:</strong> You are viewing as {session.user.email}
                    </span>
                    <Button
                        type="primary"
                        size="small"
                        icon={<LogoutOutlined />}
                        onClick={handleExitImpersonation}
                        loading={loading}
                    >
                        Exit Impersonation
                    </Button>
                </div>
            }
            type="warning"
            banner
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                borderRadius: 0
            }}
        />
    )
}
