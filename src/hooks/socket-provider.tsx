"use client";

import { io, Socket } from "socket.io-client";
import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";

/**
 * SocketProvider – jednoduchý kontext + hook pre chat (socket.io)
 *
 * 1. Zabaľ ľubovoľnú časť aplikácie:
 *    <SocketProvider url={process.env.NEXT_PUBLIC_SOCKET_URL}>
 *        <YourComponent />
 *    </SocketProvider>
 *
 * 2. Vnútri komponentu použij:
 *    const { messages, send, connected } = useChat();
 *
 * 3. send("text") odošle správu na server,
 *    `messages` obsahuje prijaté správy v poradí.
 */

interface SocketProviderProps {
    /**
     * adresa WS servera – default je lokálny 3001
     * napr. "wss://chat.example.com/socket.io"
     */
    url?: string;
    children: React.ReactNode;
}

interface ChatContextValue {
    messages: string[];
    send: (msg: string) => void;
    connected: boolean;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function SocketProvider({ url = "ws://89.168.19.129:3000", children }: SocketProviderProps) {
    const socketRef = useRef<Socket>();
    const [messages, setMessages] = useState<string[]>([]);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const socket = io(url, {
            transports: ["websocket"], // explicitne WS, zakáže long‑polling fallback
        });

        socketRef.current = socket;

        socket.on("connect", () => setConnected(true));
        socket.on("disconnect", () => setConnected(false));

        // načúva serverovej udalosti „chat“
        socket.on("chat", (msg: string) =>
            setMessages((prev) => [...prev, msg])
        );

        return () => socket.disconnect();
    }, [url]);

    const send = (msg: string) => socketRef.current?.emit("chat", msg);

    return (
        <ChatContext.Provider value={{ messages, send, connected }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat(): ChatContextValue {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error("useChat must be used within <SocketProvider>");
    return ctx;
}
