"use client";

import { Card, Typography, Divider, Select, Button, message, Input } from "antd";
import { Event } from "@/models/events";
import { FeedbackDisplay } from "@/components/feedback-display";
import { FeedbackModal } from "@/components/feedback-modal";
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
    const [feedbackUrl, setFeedbackUrl] = useState<string>(event.feedbackUrl || '');
    const [sheetsUrl, setSheetsUrl] = useState<string>(event.sheetsUrl || '');
    const [loading, setLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

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
            console.error('Chyba pri načítaní pracovných listov:', error);
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
                message.success('Pracovný list bol úspešne priradený k termínu');
            } else {
                message.error('Nepodarilo sa priradiť pracovný list');
            }
        } catch (error) {
            console.error('Chyba pri aktualizácii pracovného listu:', error);
            message.error('Chyba pri aktualizácii');
        } finally {
            setLoading(false);
        }
    };

    const handleFeedbackUrlChange = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/events/${event._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    feedbackUrl: feedbackUrl
                }),
            });

            if (response.ok) {
                message.success('URL spätnej väzby bol úspešne uložený');
                event.feedbackUrl = feedbackUrl;
            } else {
                message.error('Nepodarilo sa uložiť URL spätnej väzby');
            }
        } catch (error) {
            console.error('Chyba pri aktualizácii URL spätnej väzby:', error);
            message.error('Chyba pri aktualizácii');
        } finally {
            setLoading(false);
        }
    };

    const handleSheetsUrlChange = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/events/${event._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sheetsUrl: sheetsUrl
                }),
            });

            if (response.ok) {
                message.success('URL Google Sheets bol úspešne uložený');
                event.sheetsUrl = sheetsUrl;
            } else {
                message.error('Nepodarilo sa uložiť URL Google Sheets');
            }
        } catch (error) {
            console.error('Chyba pri aktualizácii URL Google Sheets:', error);
            message.error('Chyba pri aktualizácii');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
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
                    
                    {(userRole === 'leader' || userRole === 'animator' || userRole === 'ADMIN') && (
                        <>
                            <Divider />
                            <div className="mb-4">
                                <strong>Priradený pracovný list:</strong>
                                <div className="flex gap-2 mt-2">
                                    <Select
                                        style={{ width: 300 }}
                                        placeholder="Vyberte pracovný list pre tento termín"
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
                            <div className="mb-4">
                                <strong>URL spätnej väzby (Google Forms):</strong>
                                <div className="flex gap-2 mt-2">
                                    <Input
                                        style={{ width: 300 }}
                                        placeholder="Vložte URL Google Forms pre spätnú väzbu"
                                        value={feedbackUrl}
                                        onChange={(e) => setFeedbackUrl(e.target.value)}
                                    />
                                    <Button 
                                        type="primary" 
                                        onClick={handleFeedbackUrlChange}
                                        loading={loading}
                                        disabled={feedbackUrl === (event.feedbackUrl || '')}
                                    >
                                        Uložiť
                                    </Button>
                                    {event.feedbackUrl && (
                                        <Button 
                                            type="default" 
                                            onClick={() => setShowPreview(true)}
                                        >
                                            Náhľad
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="mb-4">
                                <strong>URL Google Sheets:</strong>
                                <div className="flex gap-2 mt-2">
                                    <Input
                                        style={{ width: 300 }}
                                        placeholder="Vložte URL Google Sheets pre zdieľanie údajov"
                                        value={sheetsUrl}
                                        onChange={(e) => setSheetsUrl(e.target.value)}
                                    />
                                    <Button 
                                        type="primary" 
                                        onClick={handleSheetsUrlChange}
                                        loading={loading}
                                        disabled={sheetsUrl === (event.sheetsUrl || '')}
                                    >
                                        Uložiť
                                    </Button>
                                    {event.sheetsUrl && (
                                        <Button 
                                            type="default" 
                                            onClick={() => window.open(event.sheetsUrl, '_blank')}
                                        >
                                            Otvoriť
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                    
                    {/* Display Google Sheets link for animators and leaders only */}
                    {event.sheetsUrl && (userRole === 'leader' || userRole === 'animator' || userRole === 'ADMIN') && (
                        <>
                            <Divider />
                            <div className="mb-4">
                                <strong>Zdieľané údaje:</strong>
                                <div className="flex gap-2 mt-2 items-center">
                                    <span>Google Sheets s údajmi pre tento termín</span>
                                    <Button
                                        type="primary"
                                        onClick={() => window.open(event.sheetsUrl, '_blank')}
                                    >
                                        Otvoriť Google Sheets
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </Card>
            </div>
            <FeedbackDisplay event={event} />
            <FeedbackModal 
                event={event}
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                isPreview={true}
            />
        </>
    );
}
