const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'zoltarsdad@gmail.com'
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  // Upsert admin user
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      isAdmin: true
    },
    create: {
      email: adminEmail,
      name: 'Admin',
      password: hashedPassword,
      isAdmin: true
    }
  })
  
  console.log('Admin user upserted:', admin.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 