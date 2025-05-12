declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            role: "ADMIN" | "LEADER" | "ANIMATOR" | "USER";
        };
    }

    interface User {
        id: string;
        role: "ADMIN" | "USER" | "ANIMATOR" | "LEADER";
        email: string
        first_name?: string
        last_name?: string
    }
}
