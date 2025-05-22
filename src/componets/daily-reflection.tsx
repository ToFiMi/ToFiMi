"use client"
import {Button, Card} from "antd";
import {Event} from "@/models/events";

export const DailyReflection = ({last_event}: { last_event :Event }) =>{


    //todo: tu nám treba poriešiť zobrazovanie zamysleni na deň
    //todo: ešte aj overiť či odovzadl ulohu ak nie tak zobraziť link na homeworks/event_id
    //todo ešte dať preklik na všetky citáty doteraz
    return(

        <>
            <Card title={last_event?.title} variant="borderless" >
                Hodnoty, ktoré nám boli zverené, nás smerujú do života v plnosti. Ale ako to tam vyzerá? Dnes poď s Otcom na miesto, ktoré sa volá nebo. Miesto, ktoré od začiatku pripravil. Skús si vysnívať miesto, ktoré je plné poznania Pána.

            </Card>
        </>


)
}
