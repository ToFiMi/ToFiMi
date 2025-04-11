import { prismaBackoffice } from '@/lib/prisma-backoffice';
import bcrypt from 'bcrypt';

async function main() {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const user = await prismaBackoffice.backofficeUser.create({
        data: {
            email: 'admin@das.sk',
            name: 'Super Admin',
            role: 'ADMIN',
            password: hashedPassword,
        },
    });

    console.log('✅ Created admin user:', user);
}

main()
   .then(() => process.exit(0))
   .catch(err => {
       console.error(err);
       process.exit(1);
   });
