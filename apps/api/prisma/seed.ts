import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create sample hospital
  const hospital = await prisma.hospital.create({
    data: {
      name: 'Cureka General Hospital',
      address: '123 Health Street, Mumbai, India'
    }
  })

  console.log('Created hospital:', hospital)

  // Create sample users
  const patientUser = await prisma.user.create({
    data: {
      id: '550e8400-e29b-41d4-a716-446655440001',
      phone: '+919876543210',
      role: 'PATIENT'
    }
  })

  await prisma.patient.create({
    data: {
      userId: patientUser.id,
      dateOfBirth: new Date('1990-01-01')
    }
  })

  const doctorUser = await prisma.user.create({
    data: {
      id: '550e8400-e29b-41d4-a716-446655440002',
      phone: '+919876543211',
      role: 'DOCTOR'
    }
  })

  await prisma.doctor.create({
    data: {
      userId: doctorUser.id,
      hospitalId: hospital.id,
      specialty: 'General Medicine'
    }
  })

  console.log('Seed data created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })