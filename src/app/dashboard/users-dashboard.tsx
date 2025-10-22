import {Layout, Space} from 'antd'
import {DailyReflection} from "@/components/daily-reflection";
import {connectToDatabase} from "@/lib/mongo";
import {Event} from "@/models/events";
import {RegistrationCard} from "@/components/registration-card";
import {FeedbackDisplay} from "@/components/feedback-display";
import {getToken} from "next-auth/jwt";
import {cookies} from "next/headers";
import {ObjectId} from "mongodb";
import dayjs from "dayjs";
import DutyRosterDisplay from "@/components/duty-roster-display";
import HomeworkDashboard from "@/components/homework-dashboard";


export default async function UsersDashboardPage() {
  const db = await connectToDatabase()
  const now = new Date()
  now.setHours(0, 0, 0, 0) // Start of today

  const token = await getToken({req: {cookies: await cookies()} as any, secret: process.env.NEXTAUTH_SECRET})
  const school_id = token?.school_id


  const last_event = await db.collection<Event>('events')
    .find({endDate: {$lt: now}, school_id: new ObjectId(school_id as string)})
    .sort({endDate: -1})
    .limit(1)
    .project({school_id: 0})
    .toArray()

  const next_event = await db.collection<Event>("events")
    .find({endDate: {$gte: now}, school_id: new ObjectId(school_id as string)})
    .sort({startDate: 1})
    .limit(1)
    .toArray()

  console.log('UsersDashboard - found next_event:', next_event.length)
  if (next_event.length > 0) {
    console.log('UsersDashboard - event:', next_event[0].title, 'endDate:', next_event[0].endDate)
  }

  // Find events ending today that have feedback URLs
  const today = dayjs().startOf('day').toDate()
  const tomorrow = dayjs().add(1, 'day').startOf('day').toDate()

  const events_ending_today = await db.collection<Event>('events')
    .find({
      endDate: {$gte: today, $lt: tomorrow},
      school_id: new ObjectId(school_id as string),
      //@ts-ignore
      feedbackUrl: {$exists: true, $ne: null, $ne: ''}
    })
    .project({school_id: 0})
    .toArray()


  const event = next_event?.[0] || null
  const next: Event | null = event ? {
    ...event as Event,
    _id: event._id.toString(),
    school_id: event.school_id?.toString?.(),
  } : null

  // Check for currently running event (today is between startDate and endDate)
  const running_event = await db.collection<Event>('events')
    .findOne({
      startDate: {$lte: now},
      endDate: {$gte: now},
      school_id: new ObjectId(school_id as string)
    })

  const runningEvent: Event | null = running_event ? {
    ...running_event as Event,
    _id: running_event._id.toString(),
    school_id: running_event.school_id?.toString?.(),
  } : null

  // Get user's group_id from user_school collection
  const userSchool = await db.collection('user_school').findOne({
    user_id: new ObjectId(token?.user_id as string),
    school_id: new ObjectId(school_id as string)
  })
  const userGroupId = userSchool?.group_id?.toString()


  return (
    <Layout className="min-h-screen">
      <Space direction="vertical" size="middle" style={{display: 'flex'}}>

        {/* Show duty roster for running event */}
        {runningEvent && (
          <DutyRosterDisplay event={runningEvent} userGroupId={userGroupId}/>
        )}

        {/* Show feedback forms for events ending today */}
        {events_ending_today.map(event => (
          <FeedbackDisplay
            key={event._id.toString()}
            // @ts-ignore
            event={{
              ...event,
              _id: event._id.toString(),
              school_id: event.school_id?.toString()
            }}
            showAlways={true}
          />
        ))}

        {/* Show pending homework assignments */}
        {token.role === "user" &&
           <HomeworkDashboard />
        }


        <DailyReflection
          last_event={last_event[0] ? {...last_event[0] as Event, _id: last_event[0]._id.toString()} : null}
          userRole={token?.role}
        />

        <RegistrationCard next_event={next?._id ? next : null} userRole={token?.role}/>


      </Space>

    </Layout>
  )

}
