import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function GET(req: NextRequest) {
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
        return Response.json({ message: "Not authenticated" }, { status: 401 });
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        return Response.json({
            user_id: payload.user_id,
            role: payload.role || (payload.isAdmin ? 'ADMIN' : 'USER'),
        });
    } catch (error) {
        return Response.json({ message: "Invalid token" }, { status: 401 });
    }
}
