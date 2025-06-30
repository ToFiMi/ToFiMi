"use client";

import { List, Avatar, Typography, Input, Button, Spin, message } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useComments } from "@/hooks/useComments";
import {useChat} from "@/hooks/socket-provider";              // stále fetchujeme prvotné dáta

const { Paragraph } = Typography;

export default function CommentsThread({
                                           entity,
                                           entityId,
                                           readOnly = false,
                                           height = 350,
                                       }: {
    entity: string;
    entityId: string;
    readOnly?: boolean;
    height?: number;
}) {
    /** 1️⃣ – init: natiahneme existujúce komentáre z RESTu */
    const { comments: initial, add } = useComments(entity, entityId);

    /** 2️⃣ – realtime: pripojenie na socket miestnosť */
    const { messages: live, send } = useChat();

    /** 3️⃣ – spoje pôvodné + live  */
    const [all, setAll] = useState(initial);

    // keď príde nový REST fetch → zresetuj
    useEffect(() => setAll(initial), [initial]);

    // každý nový socket message pridaj na koniec
     // pridaj len tie správy, ktoré patria do aktuálnej miestnosti
     useEffect(() => {
              const inRoom = live.filter(
                     (m: any) => m.entity === entity && m.entity_id === entityId
               );
               if (inRoom.length) setAll((prev) => [...prev, ...inRoom]);
             }, [live, entity, entityId]);

    /** odoslanie */
    const [text, setText] = useState("");
    const handleSend = async () => {
        if (!text.trim()) return;
        try {
            // 1. uložíme do DB (POST /comments…)  – add() vracia serverový obj.
            const saved = await add(text);

            // 2. pošleme cez socket, aby ďalší klienti videli hneď
            send(text);

            setText("");
        } catch {
            message.error("Nepodarilo sa odoslať komentár");
        }
    };

    return (
        <>
            <List
                dataSource={all}
                locale={{ emptyText: "Žiadne komentáre" }}
                renderItem={(c: any) => (
                    <List.Item
                        style={{
                            flexDirection: c.author_role === "user" ? "row-reverse" : "row",
                        }}
                    >
                        <Avatar>{c.author?.first_name?.[0]?.toUpperCase()}</Avatar>
                        <div className="mx-2">
                            <small>
                                {dayjs(c.created).format("DD.MM.YY HH:mm")} ·{" "}
                                {c.author?.first_name} {c.author?.last_name}
                            </small>
                            <Paragraph style={{ margin: 0, whiteSpace: "pre-line" }}>
                                {c.content}
                            </Paragraph>
                        </div>
                    </List.Item>
                )}
                style={{ maxHeight: height, overflowY: "auto", marginBottom: 16 }}
            />

            {!readOnly && (
                <>
                    <Input.TextArea
                        rows={3}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Napíš správu..."
                    />
                    <Button type="primary" className="mt-2" onClick={handleSend}>
                        Odoslať
                    </Button>
                </>
            )}
        </>
    );
}
