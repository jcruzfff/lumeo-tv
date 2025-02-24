import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/auth.config'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Delete all records from each table in the correct order to avoid foreign key constraints
    await prisma.mediaItem.deleteMany()
    await prisma.player.deleteMany()
    await prisma.table.deleteMany()
    await prisma.event.deleteMany()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error resetting database:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reset database' },
      { status: 500 }
    )
  }
} 