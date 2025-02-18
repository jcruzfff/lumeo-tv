import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAdmin() {
  try {
    const user = await prisma.user.update({
      where: {
        email: 'zoltarsdad@gmail.com'
      },
      data: {
        isAdmin: true
      }
    });

    console.log('Successfully updated user to admin:', user);
  } catch (error) {
    console.error('Error updating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdmin(); 