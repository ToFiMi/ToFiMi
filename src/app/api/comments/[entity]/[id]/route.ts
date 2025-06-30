// app/api/comments/[entity]/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/mongo";
import { ObjectId } from "mongodb";
import { CommentEntity } from "@/models/comment";

export async function GET(
    _: NextRequest,
    { params }: { params: { entity: CommentEntity; id: string } },
) {
    const db = await connectToDatabase();

    const comments = await db
        .collection("comments")
        .aggregate([
            {
                $match: {
                    entity: params.entity,
                    entity_id: new ObjectId(params.id),
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "author_id",
                    foreignField: "_id",
                    as: "author",
                },
            },
            { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
            {
                /* vráť len to, čo UI potrebuje */
                $project: {
                    _id: 1,
                    entity: 1,
                    entity_id: 1,
                    author_id: 1,
                    author_role: 1,
                    content: 1,
                    created: 1,
                    "author.first_name": 1,
                    "author.last_name": 1,
                },
            },
            { $sort: { created: 1 } },
        ])
        .toArray();

    return NextResponse.json(comments);
}


export async function POST(
    req: NextRequest,
    { params }: { params: { entity: CommentEntity; id: string } },
) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json("Unauthorized", { status: 401 });

    const { content } = await req.json();
    if (!content) return NextResponse.json("Empty content", { status: 400 });

    const db = await connectToDatabase();
    const comment = {
        _id: new ObjectId(),
        entity: params.entity,
        entity_id: new ObjectId(params.id),
        author_id: new ObjectId(token.id),
        author_role: token.role,
        content,
        created: new Date(),
    };

    await db.collection("comments").insertOne(comment);

    const user = await db
        .collection("users")
        .findOne(
            { _id: new ObjectId(token.user_id) },
            { projection: { first_name: 1, last_name: 1 } },
        );

    return NextResponse.json(
        { ...comment, author: user ?? null },
        { status: 201 },
    );
}
