// File: /src/app/admin/schools/[school_id]/page.tsx
import {notFound} from 'next/navigation'
import {connectToDatabase} from '@/lib/mongo'
import {ObjectId} from 'mongodb'
import {Suspense} from 'react'
import SchoolUsers, {User} from "@/app/schools/[school_id]/school-users";
import SchoolEvents from "@/app/schools/[school_id]/school-events";
import SchoolGroups from "@/app/schools/[school_id]/school-groups";


interface Props {
    params: { school_id: string }
}

export default async function SchoolDetailPage({params}: Props) {
    const param = await  params
    const db = await connectToDatabase()
    const school = await db.collection('schools').findOne({_id: new ObjectId(params.school_id)})

    if (!school) return notFound()

    const users = await db.collection('user_school').aggregate([
        {$match: {school_id: new ObjectId(param.school_id)}},
        {
            $lookup: {
                from: 'users',
                localField: 'user_id',
                foreignField: '_id',
                as: 'user_info'
            }
        },
        {$unwind: '$user_info'},
        {
            $project: {
                _id: 1,
                role: 1,
                user_info: {
                    first_name: '$user_info.first_name',
                    last_name: '$user_info.last_name',
                    email: '$user_info.email'
                }
            }
        }
    ]).toArray() as User[]

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-2">{school.name}</h1>
            <p><strong>Slug:</strong> {school.slug}</p>
            <p><strong>ID školy:</strong> {school._id.toString()}</p>

            <div className="mt-6">
                <Suspense fallback={<p>Načítavam používateľov...</p>}>
                    <SchoolUsers schoolId={param.school_id} initialUsers={users}/>
                </Suspense>
            </div>

            <div className="mt-8">
                <Suspense fallback={<p>Načítavam termíny...</p>}>
                    <SchoolEvents schoolId={param.school_id}/>
                </Suspense>
            </div>
            <div className="mt-8">
                <Suspense fallback={<p>Načítavam termíny...</p>}>
                    <SchoolGroups schoolId={param.school_id}/>
                </Suspense>
            </div>
        </div>
    )
}
