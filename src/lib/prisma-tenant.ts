import { PrismaClient } from '../../prisma/generated/tenant';

export const getPrismaTenant = (dbUrl: string) => {
    return new PrismaClient({
        datasources: {
            db: { url: dbUrl },
        },
    });
};
