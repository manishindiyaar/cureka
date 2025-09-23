import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  const user = await prisma.user.findFirst()
  console.log(user)
}

export { prisma, test }