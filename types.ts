import NextAuth from "next-auth";

declare module "next-auth" {
     interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            role: "ADMIN" | "LEADER" | "ANIMATOR" | "USER" ;
        };
    }

interface User {
        id: string;
        role: "ADMIN" | "SUPPORT";
    }
}
