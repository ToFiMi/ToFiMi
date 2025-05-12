"use client"
import {Button, Card} from "antd";
import {Term} from "../../models/terms";

export const DailyReflection = ({last_event}: { last_event :Term }) =>{

    return(

        <>
            <Card title={last_event?.title} variant="borderless" >
                Hodnoty, ktoré nám boli zverené, nás smerujú do života v plnosti. Ale ako to tam vyzerá? Dnes poď s Otcom na miesto, ktoré sa volá nebo. Miesto, ktoré od začiatku pripravil. Skús si vysnívať miesto, ktoré je plné poznania Pána.

            </Card>
        </>


)
}
