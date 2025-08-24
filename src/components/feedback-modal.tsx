"use client";

import { Modal, Typography, Alert, Button } from "antd";
import { Event } from "@/models/events";
import { useState } from "react";

const { Title } = Typography;

interface FeedbackModalProps {
    event: Event;
    isOpen: boolean;
    onClose: () => void;
    isPreview?: boolean; // For preview mode (leaders/animators)
}

export function FeedbackModal({ event, isOpen, onClose, isPreview = false }: FeedbackModalProps) {
    if (!event.feedbackUrl) {
        return null;
    }

    return (
        <Modal
            title={
                <div>
                    <Title level={4} style={{ margin: 0 }}>
                        {isPreview ? 'Náhľad: ' : ''}Spätná väzba pre {event.title}
                    </Title>
                </div>
            }
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width="90vw"
            style={{ top: 20 }}
            styles={{
                body: {
                    height: '80vh',
                    padding: 0,
                    overflow: 'hidden'
                }
            }}
            destroyOnClose
        >
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {isPreview && (
                    <Alert
                        message="Náhľad formulára"
                        description="Toto je náhľad formulára spätnej väzby. Používatelia ho uvidia v posledný deň termínu."
                        type="warning"
                        showIcon
                        style={{ margin: '16px 16px 0 16px', marginBottom: 16 }}
                    />
                )}
                <div style={{
                    flex: 1,
                    margin: 0,
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                    overflow: 'hidden'
                }}>
                    <iframe
                        src={event.feedbackUrl}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        title={isPreview ? "Náhľad spätnej väzby" : "Spätná väzba"}
                        style={{ borderRadius: 8 }}
                    >
                        <div style={{ padding: 20, textAlign: 'center' }}>
                            <p>Váš prehliadač nepodporuje iframe.</p>
                            <Button
                                type="primary"
                                onClick={() => window.open(event.feedbackUrl, '_blank')}
                            >
                                Otvoriť formulár v novom okne
                            </Button>
                        </div>
                    </iframe>
                </div>
            </div>
        </Modal>
    );
}
