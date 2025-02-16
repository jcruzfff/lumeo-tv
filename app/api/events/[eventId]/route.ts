import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/db'

export async function GET(
  request: NextRequest,
  context: { params: { eventId: string } }
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: context.params.eventId },
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

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Error fetching event' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { eventId: string } }
) {
  try {
    const body = await request.json()
    const { settings, status } = body

    const event = await prisma.event.update({
      where: { id: context.params.eventId },
      data: {
        settings,
        status,
        ...(status === 'ENDED' ? { endedAt: new Date() } : {}),
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: 'Error updating event' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { eventId: string } }
) {
  try {
    await prisma.event.delete({
      where: { id: context.params.eventId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: 'Error deleting event' },
      { status: 500 }
    )
  }
} 