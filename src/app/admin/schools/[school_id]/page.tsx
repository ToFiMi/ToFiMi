import { headers } from 'next/headers';

export default async function SchoolPage({ params }: { params: { school_id: string } }) {
    const { school_id } = params;
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = (await headers()).get('host');

    const res = await fetch(`${protocol}://${host}/api/${school_id}/users`, {
        cache: 'no-store',
    });

    if (!res.ok) {
        console.error('Fetch error:', await res.text());
        return <div className="p-6">Failed to load users.</div>;
    }

    const users = await res.json();

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Users from {school_id}</h1>
            <ul className="list-disc pl-6">
                {users.map((u: any) => (
                    <li key={u.id}>{u.first_name} {u.last_name} ({u.email})</li>
                ))}
            </ul>
        </div>
    );
}
