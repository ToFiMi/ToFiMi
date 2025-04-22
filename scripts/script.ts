import bcrypt from 'bcrypt';

async function main() {
    const hashedPassword = await bcrypt.hash('admin123', 10);




}

main()
   .then(() => process.exit(0))
   .catch(err => {
       console.error(err);
       process.exit(1);
   });
