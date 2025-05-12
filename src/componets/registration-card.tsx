"use client"
import {Button, Card} from "antd";
import {Term} from "../../models/terms";
export const RegistrationCard = ({next_event}: { next_event :Term }) => {
    return (<Card  title={next_event?.title} about={next_event.startDate.toString()} variant="borderless">

        <Button> Registrovať</Button>

    </Card>)
}
