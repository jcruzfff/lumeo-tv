import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/auth.config'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('Resetting database...')
    
    // Delete all records from each table in the correct order to avoid foreign key constraints
    await prisma.mediaItem.deleteMany()
    console.log('✓ Cleared MediaItems')
    
    await prisma.player.deleteMany()
    console.log('✓ Cleared Players')
    
    await prisma.table.deleteMany()
    console.log('✓ Cleared Tables')
    
    await prisma.event.deleteMany()
    console.log('✓ Cleared Events')

    console.log('Database reset complete! ✨')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error resetting database:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reset database' },
      { status: 500 }
    )
  }
} 