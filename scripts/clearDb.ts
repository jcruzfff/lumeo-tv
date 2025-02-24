import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearDatabase() {
  try {
    console.log('Starting database cleanup...')

    // Delete in order of dependencies
    console.log('Deleting media items...')
    await prisma.mediaItem.deleteMany()
    
    console.log('Deleting seats...')
    await prisma.seat.deleteMany()
    
    console.log('Deleting tables...')
    await prisma.table.deleteMany()
    
    console.log('Deleting players...')
    await prisma.player.deleteMany()
    
    console.log('Deleting events...')
    await prisma.event.deleteMany()
    
    console.log('Deleting users...')
    await prisma.user.deleteMany()

    console.log('Database cleanup completed successfully!')
  } catch (error) {
    console.error('Error during database cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearDatabase() 