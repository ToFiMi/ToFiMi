"use client";

import { Card, Typography, Divider } from "antd";
import { Event } from "@/models/events";
import dayjs from "dayjs";

const { Title, Paragraph } = Typography;

export function EventPage({ event }: { event: Event }) {
    return (
        <div className="p-6 max-w-3xl mx-auto">
            <Card>
                <Title level={2}>{event.title}</Title>
                <Divider />
                <Paragraph>
                    <strong>Dátum od:</strong> {dayjs(event.startDate).format("DD.MM.YYYY")}
                </Paragraph>
                <Paragraph>
                    <strong>Dátum do:</strong> {dayjs(event.endDate).format("DD.MM.YYYY")}
                </Paragraph>
                {event.description && (
                    <Paragraph>
                        <strong>Popis:</strong><br />
                        {event.description}
                    </Paragraph>
                )}
            </Card>
        </div>
    );
}
