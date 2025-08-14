'use client'
import {Button, Card, Divider, message, Typography, Select, Space, TimePicker} from 'antd'
import {useEffect, useState} from 'react'
import TagsInput from './tags-input'
import {subscribeToPush} from '@/lib/subscribePush'
import ChangePasswordModal from "@/app/profile/change-password-modal";
import dayjs, {Dayjs} from "dayjs";

const {Title, Text} = Typography

export default function UserCard({ user, active_school_id }: { user: any, active_school_id?: string  }) {
    const [hasPush, setHasPush] = useState(false)
    const [checking, setChecking] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const [reminderTime, setReminderTime] = useState<Dayjs | null>(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        navigator.serviceWorker?.ready
            .then(reg => reg.pushManager.getSubscription())
            .then(sub => setHasPush(!!sub))
            .catch(err => console.warn('Push check failed', err))
            .finally(() => setChecking(false))

        fetch('/api/reminder')
            .then(res => res.json())
            .then(data => {
                if (data?.hour !== undefined && data?.minute !== undefined) {
                    setReminderTime(dayjs().hour(data.hour).minute(data.minute))
                }
            })
            .catch(() => {})
    }, [])

    const handleEnablePush = async () => {
        try {
            if (Notification.permission !== 'granted') {
                const permission = await Notification.requestPermission()
                if (permission !== 'granted') {
                    message.warning('Notifikácie neboli povolené.')
                    return
                }
            }

            await subscribeToPush(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
            message.success('Notifikácie boli zapnuté 🎉')
            setHasPush(true)
        } catch (e) {
            console.error(e)
            message.error('Nepodarilo sa zapnúť notifikácie')
        }
    }

    const handleSaveReminder = async () => {
        if (!reminderTime) return
        setSaving(true)
        try {
            const res = await fetch('/api/reminder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hour: reminderTime.hour(),
                    minute: reminderTime.minute(),
                }),
            })
            if (res.ok) {
                message.success('Denné pripomenutie bolo uložené')
            } else {
                message.error('Chyba pri ukladaní pripomenutia')
            }
        } catch (e) {
            message.error('Chyba siete pri ukladaní')
        } finally {
            setSaving(false)
        }
    }

    const handleSchoolSwitch = async (schoolId: string) => {
        try {
            const res = await fetch('/api/me/switch-school', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ school_id: schoolId }),
            })
            if (res.ok) {
                message.success('Škola bola prepnutá')
                // Reload the page to update the session
                window.location.reload()
            } else {
                message.error('Chyba pri prepínaní školy')
            }
        } catch (e) {
            message.error('Chyba siete pri prepínaní školy')
        }
    }

    const active_school = user.schools.find((school)=> school.school._id ===  active_school_id )
    const hasMultipleSchools = user.schools && user.schools.length > 1
    return (
        <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={3} style={{ margin: 0 }}>Môj profil</Title>
                <Button type="primary" onClick={() => setIsModalOpen(true)} >
                    Zmeniť heslo
                </Button>
            </div>

            <div style={{ marginTop: 12 }}>
                <Text strong>Meno:</Text> <Text>{user?.first_name} {user?.last_name}</Text><br />
                <Text strong>Email:</Text> <Text>{user?.email}</Text><br />
                {active_school && (
                    <>
                        <Text strong>Škola:</Text> <Text>{active_school.school.name}</Text><br />
                        <Text strong>Rola:</Text> <Text>{active_school.role}</Text><br />
                    </>
                )}
            </div>

            {hasMultipleSchools && (
                <div style={{ marginTop: 12 }}>
                    <Divider />
                    <Title level={4}>Prepnúť školu</Title>
                    <Text>Máš prístup k viacerým školám. Môžeš prepnúť na inú školu bez odhlásenia.</Text>
                    <div style={{ marginTop: 8 }}>
                        <Select
                            placeholder="Vyber školu"
                            style={{ width: '100%', maxWidth: 300 }}
                            value={active_school_id}
                            onChange={handleSchoolSwitch}
                        >
                            {user.schools.map((school: any) => (
                                <Select.Option 
                                    key={school.school._id} 
                                    value={school.school._id}
                                >
                                    {school.school.name} ({school.role})
                                </Select.Option>
                            ))}
                        </Select>
                    </div>
                </div>
            )}

            {user.schools && user.schools.length > 0 && !hasMultipleSchools && (
                <div style={{ marginTop: 12 }}>
                    <Text type="secondary">
                        Pripojený k 1 škole: {active_school?.school.name}
                    </Text>
                </div>
            )}

            <div style={{ marginTop: 12 }}>
                <Text strong>Notifikácie:</Text>{' '}
                {checking ? 'Načítavam...' : hasPush ? (
                    <Text type="success">Zapnuté</Text>
                ) : (
                    <>
                        <Text type="secondary">Vypnuté</Text>{' '}
                        <Button type="link" onClick={handleEnablePush} style={{ padding: 0 }}>Zapnúť</Button>
                    </>
                )}
            </div>

         {/*TODO to musi byť nejaky cron ešte*/}
            {/*<Divider />*/}
            {/*<Title level={4}>Denné pripomenutie</Title>*/}
            {/*<Text>*/}
            {/*    Zvoľ si čas, kedy ti má prísť pripomenutie na zamyslenie dňa.*/}
            {/*</Text>*/}
            {/*<div style={{ marginTop: 8 }}>*/}
            {/*    <TimePicker*/}
            {/*        value={reminderTime}*/}
            {/*        onChange={(value) => setReminderTime(value)}*/}
            {/*        format="HH:mm"*/}
            {/*        minuteStep={5}*/}
            {/*    />*/}
            {/*    <Button*/}
            {/*        type="primary"*/}
            {/*        onClick={handleSaveReminder}*/}
            {/*        loading={saving}*/}
            {/*        style={{ marginLeft: 12 }}*/}
            {/*    >*/}
            {/*        Uložiť pripomenutie*/}
            {/*    </Button>*/}
            {/*</div>*/}

            <Divider />
            <Title level={4}>Alergie a intolerancie</Title>
            <TagsInput tag_type={"allergy"} />
            <Divider />

            <ChangePasswordModal setIsModalOpen={setIsModalOpen} isModalOpen={isModalOpen} />
        </Card>
    )
}
