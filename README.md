# 🏫 DAS Backoffice & Multi-Tenant App

This is a Next.js-based multi-tenant application for the **Diocesan Animator School (DAS)**. Each school year has its own isolated PostgreSQL database, and there's a central **backoffice** where administrators can manage them.

---

## 🛠️ Tech Stack

- [Next.js](https://nextjs.org/) (App Router)
- [PostgreSQL](https://www.postgresql.org/) (multi-database: one per school)
- [Prisma](https://www.prisma.io/) (with multiple schemas)
- [NextAuth.js](https://next-auth.js.org/) (Credentials provider)
- [Ant Design](https://ant.design/)
- Docker (optional, for local PostgreSQL)
- PhpStorm (optional, for DB visualization)

---

## ⚙️ Requirements

- Node.js v18+
- PostgreSQL installed (locally or via Docker)
- `pnpm`, `npm` or `yarn`
- PhpStorm (optional but helpful for DB view)

---

## 🔧 Setup Instructions

### 1. Clone the project & install dependencies

```bash
git clone https://github.com/your-org/das-multitenant-app.git
cd das-multitenant-app

npm install
```
### 2. Generate the keys
```bash
npx web-push generate-vapid-keys
```
### 3. Create .env file
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=super-secret-value

BACKOFFICE_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/backoffice
TENANT_DATABASE_URL=postgresql://localhost:5432/dummy
# Push notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your vapid key
NEXT_PUBLIC_VAPID_PRIVATE_KEY=your vapid key
```
### 4. Create the backoffice database
```bash
createdb backoffice
```
### 5. Run migrations and generate Prisma clients
```bash
npx prisma migrate dev --schema=prisma/backoffice.schema.prisma

npx prisma generate --schema=prisma/backoffice.schema.prisma
npx prisma generate --schema=prisma/das.schema.prisma
```
### 6. Create initial admin user
```bash
npx tsx scripts/script.ts
```
### 7. Start the development server
```bash
npm run dev
```


Visit http://localhost:3000/admin/login

Login with:
•	Email: admin@das.sk
•	Password: admin123

