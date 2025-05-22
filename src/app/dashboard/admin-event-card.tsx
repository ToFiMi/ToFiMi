"use client"

import { Event } from "@/models/events"
import {Card, Typography, Space, Divider, Tag, Statistic, Flex, List, Button} from "antd"
import dayjs from "dayjs";
import {useState} from "react";
import {useMobile} from "@/hooks/useMobile";
require("dayjs/locale/sk");


const { Title, Text } = Typography

export type AdminEventCardProps = {
    next_event: Event | null
    previous_event: Event | null
    current_event:Event
    next_registrations: AdminReportRegistrations
}
export type AdminReportRegistrations = {
    user: {
        first_name: string
        last_name: string
        email: string
    }
    meals: { date: string, time: string }[]
    allergies: string[]
}[]

export const AdminEventCard = ({ next_event, next_registrations ,current_event, previous_event }: AdminEventCardProps) => {

    const [event, setEvent] = useState(current_event)
    const [registrations, setRegistrations] = useState(next_registrations)
    const [previousEvent, setPreviousEvent] = useState(previous_event)
    const [nextEvent, setNextEvent] = useState(next_event)
    const mealCounts: Record<string, Record<string, number>> = {}

    const dayToDateMap: Record<string, string> = {}

    const isMobile = useMobile()
    event.meals.forEach(meal => {
        const date = dayjs(meal.date).format('YYYY-MM-DD')
        const dayName = dayjs(meal.date).format('dddd').toLowerCase() // napr. 'friday'
        dayToDateMap[dayName] = date


        mealCounts[date] ??= {}
        meal.times.forEach(time => {
            mealCounts[date][time] ??= 0
        })
    })




    registrations.forEach(reg => {
        reg.meals.forEach((meal: { date: string | Date, time: string }) => {
            const dateStr = new Date(meal.date).toISOString().split('T')[0]
            const time = meal.time

            mealCounts[dateStr] ??= {}
            mealCounts[dateStr][time] ??= 0
            mealCounts[dateStr][time] += 1
        })
    })

    const allergyMap = new Map<string, number>()
    for (const reg of registrations) {
        for (const allergy of reg.allergies) {
            allergyMap.set(allergy, (allergyMap.get(allergy) || 0) + 1)
        }
    }

    const allergyEntries = Array.from(allergyMap.entries()).map(([name, count]) => ({
        name,
        count,
    }))

    return (
        <Card
            title={
                <Flex justify="space-between" align="center">
                    <Button
                        type="default"
                        disabled={!previousEvent}
                        onClick={async () => {
                            const res = await fetch(`/api/events/${previousEvent._id}/report`)
                            const data = await res.json()
                            setEvent(data.event)
                            setPreviousEvent(data?.previous_event || "")
                            setNextEvent(data?.next_event || "")
                            setRegistrations(data.registrations)
                        }}
                    >
                        ← { isMobile?"":previousEvent?.title}
                    </Button>

                    <Title level={3} style={{ margin: 0 }}>{event.title}</Title>

                    <Button
                        type="default"
                        disabled={!nextEvent}
                        onClick={async () => {
                            const res = await fetch(`/api/events/${nextEvent._id}/report`)
                            const data = await res.json()
                            setEvent(data.event)
                            setPreviousEvent(data?.previous_event|| "")
                            setNextEvent(data?.next_event||"")
                            setRegistrations(data.registrations)
                        }}
                    >
                        { isMobile?"": nextEvent?.title} →
                    </Button>
                </Flex>
            }
            style={{ maxWidth: 900, margin: '2rem auto' }}
        >
            {event ? (
            <Flex vertical gap="middle">
                <Text><strong>Dátum:</strong> {dayjs(event?.startDate).locale("sk").format('DD.MM.YYYY dddd')} – {dayjs(event?.endDate).locale("sk").format('DD.MM.YYYY dddd')}</Text>
                <Text><strong>Ročník:</strong> {event?.grade}. ročník</Text>
                <Text><strong>Popis:</strong> {event?.description || "—"}</Text>

                <Divider />

                <Title level={5}>Počet porcií na jedlá</Title>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    {Object.entries(mealCounts).map(([date, times]) => (
                        <div key={date} style={{
                            border: '1px solid #f0f0f0',
                            borderRadius: 8,
                            padding: 12,
                            minWidth: 220,
                            flexGrow: 1,
                            background: '#fafafa'
                        }}>
                            <Text strong>{dayjs(date).locale('sk').format('dddd')} ({dayjs(date).format('DD.MM.YYYY')})</Text>
                            <List style={{  paddingLeft: 16 }}>
                                {Object.entries(times).map(([time, count]) => (
                                    <List.Item key={time}>{time} – <strong>{count}</strong>  {count=== 1?"porcia": "porcií"} </List.Item>
                                ))}
                            </List>
                        </div>
                    ))}
                </div>

                <Divider />

                <Title level={5}>Alergie</Title>
                {allergyEntries.length > 0 ? (
                    <Flex wrap>
                        {allergyEntries.map((a) => (
                            <Tag key={a.name} color="volcano">
                                {a.name} ({a.count})
                            </Tag>
                        ))}
                    </Flex>
                ) : (
                    <Text type="secondary">Žiadne alergie</Text>
                )}
            </Flex>
            ) : (
                <Text strong>No next event</Text>
            )}

        </Card>
    )
}
