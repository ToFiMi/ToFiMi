"use client";

import { Card, Typography, Divider, Select, Button, message } from "antd";
import { Event } from "@/models/events";
import dayjs from "dayjs";
import { useState, useEffect } from "react";

const { Title, Paragraph } = Typography;

interface Worksheet {
    _id: string;
    title: string;
}

export function EventPage({ event, userRole }: { event: Event; userRole?: string }) {
    const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
    const [selectedWorksheet, setSelectedWorksheet] = useState<string | null>(
        event.worksheet_id?.toString() || null
    );
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (userRole === 'leader' || userRole === 'animator') {
            fetchWorksheets();
        }
    }, [userRole]);

    const fetchWorksheets = async () => {
        try {
            const response = await fetch('/api/worksheets/library');
            if (response.ok) {
                const data = await response.json();
                setWorksheets(data);
            }
        } catch (error) {
            console.error('Error fetching worksheets:', error);
        }
    };

    const handleWorksheetChange = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/events/${event._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    worksheet_id: selectedWorksheet
                }),
            });

            if (response.ok) {
                message.success('Worksheet bol úspešne priradený k eventu');
            } else {
                message.error('Nepodarilo sa priradiť worksheet');
            }
        } catch (error) {
            console.error('Error updating worksheet:', error);
            message.error('Chyba pri aktualizácii');
        } finally {
            setLoading(false);
        }
    };

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
                
                {(userRole === 'leader' || userRole === 'animator') && (
                    <>
                        <Divider />
                        <div className="mb-4">
                            <strong>Priradený worksheet:</strong>
                            <div className="flex gap-2 mt-2">
                                <Select
                                    style={{ width: 300 }}
                                    placeholder="Vyberte worksheet pre tento event"
                                    value={selectedWorksheet}
                                    onChange={setSelectedWorksheet}
                                    allowClear
                                >
                                    {worksheets.map(worksheet => (
                                        <Select.Option key={worksheet._id} value={worksheet._id}>
                                            {worksheet.title}
                                        </Select.Option>
                                    ))}
                                </Select>
                                <Button 
                                    type="primary" 
                                    onClick={handleWorksheetChange}
                                    loading={loading}
                                    disabled={selectedWorksheet === (event.worksheet_id?.toString() || null)}
                                >
                                    Uložiť
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
}
