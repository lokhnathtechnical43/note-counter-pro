import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

async function main() {
  const prisma = new PrismaClient()
  
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dailylife.com' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@dailylife.com',
      name: 'Admin',
      password: hashedPassword,
      role: 'admin'
    }
  })
  
  console.log('✅ Admin user created/updated:', admin.email)
  console.log('   Password: admin123')
  console.log('   Role:', admin.role)
  
  await prisma.$disconnect()
}

main()
