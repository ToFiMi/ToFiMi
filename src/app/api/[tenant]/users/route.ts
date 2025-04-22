import { NextResponse } from 'next/server';

export async function GET(
    req: Request,
    { params }: { params: { tenant: string } }
) {
    const tenantId = params.tenant;





    return NextResponse.json({});
}
