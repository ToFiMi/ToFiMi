import { prismaBackoffice } from '@/lib/prisma-backoffice';
import Link from 'next/link';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Space } from 'antd';

export default async function SchoolsPage() {
    const schools = await prismaBackoffice.school.findMany({
        orderBy: { createdAt: 'desc' },
    });

    const handleCreateSchool = async (): Promise<void> => {

    }


    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">

                <Link href="/admin/schools/create">
                    <Button type="primary" icon={<PlusOutlined />} size="middle">
                        Create School
                    </Button>
                </Link>
            </div>

            <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
                {schools.map((school) => (
                    <Card
                        key={school.id}
                        title={school.name}
                        extra={<Link href={`/admin/schools/${school.id}`}>View</Link>}
                    >
                        <p><strong>ID:</strong> {school.id}</p>
                        <p><strong>Created:</strong> {new Date(school.createdAt).toLocaleDateString()}</p>
                    </Card>
                ))}
            </Space>
        </div>
    );
}
