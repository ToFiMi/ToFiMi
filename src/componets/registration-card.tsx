"use client"
import {Button, Card} from "antd";
import {Event} from "../../models/events";
export const RegistrationCard = ({next_event}: { next_event :Event | null }) => {
    return (<Card  title={next_event?.title} about={next_event?.startDate?.toString()} variant="borderless">

        <Button> Registrovať</Button>

    </Card>)
}
