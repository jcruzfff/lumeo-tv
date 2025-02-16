import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/app/lib/db'
import type { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/auth.config'

type EventSettings = Prisma.InputJsonValue

interface EventUpdateData {
  settings: EventSettings;
  status?: 'ACTIVE' | 'ENDED';
}

async function getEvent(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
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
}

async function updateEvent(eventId: string, data: EventUpdateData) {
  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      settings: data.settings,
      status: data.status,
      ...(data.status === 'ENDED' ? { endedAt: new Date() } : {}),
    },
  })

  return NextResponse.json(event)
}

async function deleteEvent(eventId: string) {
  await prisma.event.delete({
    where: { id: eventId },
  })

  return NextResponse.json({ success: true })
}

export const dynamic = 'force-dynamic'
export const dynamicParams = true

interface RouteSegmentProps {
  params: { eventId: string }
}

export async function GET(
  req: NextRequest,
  props: RouteSegmentProps
) {
  const { eventId } = props.params
  console.log('GET request received for eventId:', eventId)
  
  try {
    const session = await getServerSession(authOptions)
    console.log('Session state:', session ? 'Authenticated' : 'Unauthenticated')

    if (!session) {
      console.log('Unauthorized access attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return await getEvent(eventId)
  } catch (error) {
    console.error('Error in GET /api/events/[eventId]:', error)
    return NextResponse.json(
      { error: 'Error fetching event' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  props: RouteSegmentProps
) {
  const { eventId } = props.params
  console.log('PATCH request received for eventId:', eventId)
  
  try {
    const session = await getServerSession(authOptions)
    console.log('Session state:', session ? 'Authenticated' : 'Unauthenticated')

    if (!session) {
      console.log('Unauthorized access attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    return await updateEvent(eventId, body)
  } catch (error) {
    console.error('Error in PATCH /api/events/[eventId]:', error)
    return NextResponse.json(
      { error: 'Error updating event' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  props: RouteSegmentProps
) {
  const { eventId } = props.params
  console.log('DELETE request received for eventId:', eventId)
  
  try {
    const session = await getServerSession(authOptions)
    console.log('Session state:', session ? 'Authenticated' : 'Unauthenticated')

    if (!session) {
      console.log('Unauthorized access attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return await deleteEvent(eventId)
  } catch (error) {
    console.error('Error in DELETE /api/events/[eventId]:', error)
    return NextResponse.json(
      { error: 'Error deleting event' },
      { status: 500 }
    )
  }
} 