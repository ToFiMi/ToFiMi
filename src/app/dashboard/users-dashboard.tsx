import {Layout, Typography} from 'antd'
import {DailyReflection} from "@/componets/daily-reflection";
import moment from "moment"

const {Header, Content} = Layout
const {Title, Text} = Typography


export default function UsersDashboardPage() {
    const now = moment()

    return (
        <Layout className="min-h-screen">
            {/*<Content className="p-6">*/}

                <DailyReflection/>

            {/*</Content>*/}
        </Layout>
    )

}
