import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  
  // Hash password using same method as auth route
  const encoder = new TextEncoder()
  const data = encoder.encode('admin123')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const password = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dailylife.com' },
    update: {},
    create: {
      email: 'admin@dailylife.com',
      name: 'Admin',
      password,
      role: 'admin'
    }
  })
  
  console.log('Admin user created:', admin.email)
  await prisma.$disconnect()
}

main()
