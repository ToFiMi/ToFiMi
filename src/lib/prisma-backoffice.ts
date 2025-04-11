import { PrismaClient } from '../../prisma/generated/backoffice';

export const prismaBackoffice = new PrismaClient({
    datasources: {
        db: {
            url: process.env.BACKOFFICE_DATABASE_URL,
        },
    },
});
