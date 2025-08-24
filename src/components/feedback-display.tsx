"use client";

import { Card, Typography, Alert, Button } from "antd";
import { Event } from "@/models/events";
import { FeedbackModal } from "@/components/feedback-modal";
import dayjs from "dayjs";
import { useState } from "react";

const { Title, Text } = Typography;

interface FeedbackDisplayProps {
    event: Event;
    showAlways?: boolean; // Show feedback regardless of date (for dashboard)
}

export function FeedbackDisplay({ event, showAlways = false }: FeedbackDisplayProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const today = dayjs();
    const eventEndDate = dayjs(event.endDate);
    const isLastDay = today.isSame(eventEndDate, 'day');

    if (!event.feedbackUrl) {
        return null;
    }

    if (!showAlways && !isLastDay) {
        return null;
    }

    return (
        <>
            <div>
                <Card style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Title level={3} style={{ margin: 0 }}>Spätná väzba pre {event.title}</Title>
                        <Button
                            type="primary"
                            size="large"
                            onClick={() => setIsModalOpen(true)}
                        >
                            Vyplniť spätnú väzbu
                        </Button>
                    </div>
                </Card>
            </div>
            <FeedbackModal
                event={event}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                isPreview={false}
            />
        </>
    );
}
