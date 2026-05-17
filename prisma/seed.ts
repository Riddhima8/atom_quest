import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clear existing users to prevent duplicates if run multiple times
  await prisma.user.deleteMany()

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: 'password',
      role: 'ADMIN',
    },
  })

  // Create Manager
  const manager = await prisma.user.create({
    data: {
      username: 'manager',
      password: 'password',
      role: 'MANAGER',
    },
  })

  // Create Employee
  const employee = await prisma.user.create({
    data: {
      username: 'employee',
      password: 'password',
      role: 'EMPLOYEE',
      managerId: manager.id,
    },
  })

  console.log('Seeded users:')
  console.log({ admin, manager, employee })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
