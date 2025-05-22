"use client"
import { Card, Space, Typography} from "antd";
import dayjs from "dayjs";
import {DailyReflection} from "@/models/daliy-reflections";
const { Text, Paragraph } = Typography

export default function ReflectionsList({reflections}:{reflections: DailyReflection[]}){
    return(
        <main className="max-w-4xl mx-auto py-10 px-4">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>


                {reflections.map(ref => (
                    <Card key={ref._id.toString()} title={dayjs(ref.date).format('DD. MM. YYYY')}>
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
