import NextAuth from "next-auth";

declare module "next-auth" {
     interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            role: "ADMIN" | "SUPPORT";
        };
    }

interface User {
        id: string;
        role: "ADMIN" | "SUPPORT";
    }
}
