import { prisma } from '@/app/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/auth.config'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  const { eventId } = params
  console.log('GET request received for eventId:', eventId)
  
  try {
    const session = await getServerSession(authOptions)
    console.log('Session state:', session ? 'Authenticated' : 'Unauthenticated')

    if (!session) {
      console.log('Unauthorized access attempt')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      })
    }

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
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
      })
    }

    return new Response(JSON.stringify(event))
  } catch (error) {
    console.error('Error in GET /api/events/[eventId]:', error)
    return new Response(JSON.stringify({ error: 'Error fetching event' }), {
      status: 500,
    })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      })
    }

    const { status, settings } = await request.json()
    
    // Validate the event exists
    const event = await prisma.event.findUnique({
      where: { id: params.eventId },
    })

    if (!event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
      })
    }

    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id: params.eventId },
      data: {
        status,
        settings: {
          ...settings,
          // Ensure period is within bounds
          period: Math.min(settings.period || 1, settings.totalPeriods || 4),
          // Default to 4 periods if not specified
          totalPeriods: settings.totalPeriods || 4
        },
        ...(status === 'ENDED' ? { endedAt: new Date() } : {}),
      },
    })

    return new Response(JSON.stringify(updatedEvent))
  } catch (error) {
    console.error('Error updating event:', error)
    return new Response(JSON.stringify({ error: 'Failed to update event' }), {
      status: 500,
    })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      })
    }

    await prisma.event.delete({
      where: { id: params.eventId },
    })

    return new Response(JSON.stringify({ success: true }))
  } catch (error) {
    console.error('Error deleting event:', error)
    return new Response(JSON.stringify({ error: 'Failed to delete event' }), {
      status: 500,
    })
  }
} 