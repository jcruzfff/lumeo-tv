import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/auth.config'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

interface RouteParams {
  params: {
    eventId: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { eventId } = params;
    console.log('GET request received for eventId:', eventId)
    
    const session = await getServerSession(authOptions)
    console.log('Session state:', session ? 'Authenticated' : 'Unauthenticated')

    if (!session) {
      console.log('Unauthorized access attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const event = await prisma.event.findUnique({
      where: {
        id: eventId
      },
      include: {
        mediaItems: true,
        tables: true,
        waitingList: {
          orderBy: {
            position: 'asc'
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { eventId } = params;
    const data = await request.json();

    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const event = await prisma.event.findUnique({
      where: {
        id: eventId
      },
      include: {
        mediaItems: true,
        tables: true,
        waitingList: {
          orderBy: {
            position: 'asc'
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const updatedEvent = await prisma.event.update({
      where: {
        id: eventId
      },
      data: {
        status: data.status,
        settings: data.settings,
        endedAt: data.status === 'ENDED' ? new Date() : undefined
      },
      include: {
        mediaItems: true,
        tables: true,
        waitingList: {
          orderBy: {
            position: 'asc'
          }
        }
      }
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    console.log('Attempting to delete event:', params.eventId);

    // Delete all related records first
    await prisma.$transaction([
      // Delete media items
      prisma.mediaItem.deleteMany({
        where: { eventId: params.eventId },
      }),
      // Delete tables
      prisma.table.deleteMany({
        where: { eventId: params.eventId },
      }),
      // Delete waiting list entries
      prisma.player.deleteMany({
        where: { eventId: params.eventId },
      }),
      // Finally delete the event
      prisma.event.delete({
        where: { id: params.eventId },
      }),
    ]);

    console.log('Event and related records deleted successfully');
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to delete event',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
} 