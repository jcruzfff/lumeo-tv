const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetDatabase() {
  try {
    // Delete all records from each table in the correct order
    console.log('Deleting all records...');
    
    // Delete MediaItems first (they reference Events)
    await prisma.mediaItem.deleteMany();
    console.log('✓ Cleared MediaItems');
    
    // Delete Players (they reference Events)
    await prisma.player.deleteMany();
    console.log('✓ Cleared Players');
    
    // Delete Seats before Tables (they reference Tables)
    await prisma.seat.deleteMany();
    console.log('✓ Cleared Seats');
    
    // Delete Tables (they reference Events)
    await prisma.table.deleteMany();
    console.log('✓ Cleared Tables');
    
    // Delete Events (they reference Users)
    await prisma.event.deleteMany();
    console.log('✓ Cleared Events');
    
    // Delete Users last
    await prisma.user.deleteMany();
    console.log('✓ Cleared Users');

    console.log('Database reset complete! ✨');
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase(); 