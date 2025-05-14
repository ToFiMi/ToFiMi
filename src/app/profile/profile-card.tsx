"use client"
import { Card, Typography, Divider } from 'antd'
import TagsInput from './tags-input'
import {User} from "../../../models/user";
const { Title, Text } = Typography

export default function UserCard({ user }: { user: any }) {
return(
<Card>
    <Title level={3}>Môj profil</Title>
    <Text strong>Meno:</Text> <Text>{user.first_name} {user.last_name}</Text><br/>
    <Text strong>Email:</Text> <Text>{user.email}</Text>

    <Divider />
    <Title level={4}>Alergie a intolerancie</Title>
    <TagsInput userId={user._id.toString()} />
</Card>
)}
