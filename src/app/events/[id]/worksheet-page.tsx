"use client"

import { Card, Typography, Alert } from "antd"
import WorksheetSubmission from "@/components/worksheet-submission"

const { Title, Paragraph } = Typography

interface WorksheetPageProps {
    worksheet: any
    event_id: string
    event_name: string
    registration: any
}

export default function WorksheetPage({ worksheet, event_id, event_name, registration }: WorksheetPageProps) {
    const getAlertMessage = () => {
        if (!registration) {
            return "Nebol si registrovaný na tento event. Vypracuj worksheet nižšie."
        }
        if (registration.attended === false) {
            return "Nebola zaznamenaná tvoja účasť na tomto evente. Vypracuj worksheet nižšie."
        }
        if (registration.attended === null) {
            return "Tvoja účasť ešte nebola overená. Zatiaľ vypracuj worksheet nižšie."
        }
        return ""
    }

    if (!worksheet) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <Title level={4}>Worksheet pre neúčastníkov</Title>
                <Alert
                    message="Worksheet nie je k dispozícii"
                    description="Pre tento event nie je nastavený žiadny worksheet."
                    type="warning"
                    showIcon
                />
            </div>
        )
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <Title level={4}>Worksheet pre {event_name}</Title>
            
            <Alert
                message={getAlertMessage()}
                type="info"
                showIcon
                className="mb-6"
            />

            <Paragraph>
                Keďže si sa nezúčastnil/a na tomto evente, vypracuj nasledujúci worksheet:
            </Paragraph>

            <WorksheetSubmission 
                eventId={event_id}
            />
        </div>
    )
}