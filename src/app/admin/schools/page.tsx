
import Link from 'next/link';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Space } from 'antd';

export default async function SchoolsPage() {


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

            </Space>
        </div>
    );
}
