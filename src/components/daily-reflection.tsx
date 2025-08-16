"use client"
import {Button, Card, Typography, Space} from "antd";
import {Event} from "@/models/events";
import {DailyReflection as DailyReflectionModel} from "@/models/daliy-reflections";
import {useEffect, useState} from "react";
import Link from "next/link";
import dayjs from "dayjs";
import ReflectionEditModal from "@/components/reflection-edit-modal";

const { Text, Paragraph } = Typography;

interface DailyReflectionProps {
    last_event: Event
    userRole?: 'ADMIN' | 'user' | 'leader' | 'animator' | null
}

export const DailyReflection = ({last_event, userRole}: DailyReflectionProps) =>{
    const [todayReflection, setTodayReflection] = useState<DailyReflectionModel | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasHomework, setHasHomework] = useState(false);

    const handleReflectionUpdate = (updatedReflection: DailyReflectionModel) => {
        setTodayReflection(updatedReflection)
    }

    useEffect(() => {
        // Fetch today's reflection
        const fetchTodayReflection = async () => {
            try {
                const response = await fetch('/api/daily-reflections?today=true', {
                    credentials: 'include'
                });
                if (response.ok) {
                    const reflections = await response.json();
                    setTodayReflection(reflections[0] || null);
                }
            } catch (error) {
                console.error('Error fetching today\'s reflection:', error);
            } finally {
                setLoading(false);
            }
        };

        // Check if user has submitted homework for the last event (only for regular users)
        const checkHomework = async () => {
            if (last_event?._id && userRole === 'user') {
                try {
                    const response = await fetch(`/api/homeworks?event_id=${last_event._id}`, {
                        credentials: 'include'
                    });
                    if (response.ok) {
                        const homework = await response.json();
                        setHasHomework(!!homework);
                    }
                } catch (error) {
                    console.error('Error checking homework:', error);
                }
            }
        };

        fetchTodayReflection();
        checkHomework();
    }, [last_event, userRole]);

    if (loading) {
        return (
            <Card title="Denné zamyslenie" variant="borderless" loading>
                Načítavam...
            </Card>
        );
    }

    return(
        <>
            <Card
                title={todayReflection ? `Denné zamyslenie - ${dayjs(todayReflection.date).format('DD.MM.YYYY')}` : "Denné zamyslenie"}
                variant="borderless"
                extra={
                    <Space>
                        {todayReflection && (
                            <ReflectionEditModal
                                reflection={todayReflection}
                                userRole={userRole}
                                onUpdate={handleReflectionUpdate}
                            />
                        )}
                        <Link href="/daily-reflections">
                            <Button type="link" size="small">Všetky zamyslenia</Button>
                        </Link>
                    </Space>
                }
            >
                {todayReflection ? (
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        {todayReflection.verse_reference?.map((v: any, i: number) => (
                            <div key={i}>
                                <Text strong>{v.reference}</Text>
                                <Paragraph style={{ marginBottom: 8 }}>{v.verse}</Paragraph>
                            </div>
                        ))}
                        <Paragraph>{todayReflection.content}</Paragraph>

                        {last_event && !hasHomework && userRole === 'user' && (
                            <div style={{ marginTop: 16, padding: 12, backgroundColor: '#fff7e6', borderRadius: 6, border: '1px solid #ffd591' }}>
                                <Text type="warning">
                                    Ešte si neodovzdal domácu úlohu pre "{last_event.title}".{' '}
                                    <Link href={`/events/${last_event._id}`}>
                                        <Button type="link" size="small" style={{ padding: 0 }}>
                                            Odovzdať teraz
                                        </Button>
                                    </Link>
                                </Text>
                            </div>
                        )}
                    </Space>
                ) : (
                    <div>
                        <Paragraph>Na dnes nie je k dispozícii žiadne zamyslenie.</Paragraph>
                        <Link href="/daily-reflections">
                            <Button type="primary" ghost>Zobraziť všetky zamyslenia</Button>
                        </Link>
                    </div>
                )}
            </Card>
        </>
    )
}
