"use client"
import { Card, Space, Typography} from "antd";
import dayjs from "dayjs";
import {DailyReflection} from "@/models/daliy-reflections";
import ReflectionEditModal from "@/componets/reflection-edit-modal";
import { useState } from "react";

const { Text, Paragraph } = Typography

interface ReflectionsListProps {
    reflections: DailyReflection[]
    userRole?: 'ADMIN' | 'user' | 'leader' | 'animator' | null
}

export default function ReflectionsList({reflections, userRole}: ReflectionsListProps){
    const [reflectionsList, setReflectionsList] = useState(reflections)
    
    const handleReflectionUpdate = (updatedReflection: DailyReflection) => {
        setReflectionsList(prev => 
            prev.map(reflection => 
                reflection._id.toString() === updatedReflection._id.toString() 
                    ? updatedReflection 
                    : reflection
            )
        )
    }
    return(
        <main className="max-w-4xl mx-auto py-10 px-4">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>


                {reflectionsList.map(ref => (
                    <Card 
                        key={ref._id.toString()} 
                        title={dayjs(ref.date).format('DD. MM. YYYY')}
                        extra={
                            <ReflectionEditModal 
                                reflection={ref} 
                                userRole={userRole} 
                                onUpdate={handleReflectionUpdate}
                            />
                        }
                    >
                        <Space direction="vertical" size="small">
                            {ref.verse_reference.map((v: any, i: number) => (
                                <div key={i}>
                                    <Text strong>{v.reference}</Text>
                                    <Paragraph>{v.verse}</Paragraph>
                                </div>
                            ))}
                            <Paragraph>{ref.content}</Paragraph>
                        </Space>
                    </Card>
                ))}
            </Space>
        </main>
    )
}
