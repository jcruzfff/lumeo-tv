import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, type, settings } = body

    const event = await prisma.event.create({
      data: {
        name,
        type,
        settings,
        status: 'ACTIVE',
        startedAt: new Date(),
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Error creating event' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      include: {
        mediaItems: true,
        tables: true,
        waitingList: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Error fetching events' },
      { status: 500 }
    )
  }
} 