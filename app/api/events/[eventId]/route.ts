import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { isPokerSettings, isBasketballSettings, isCustomSettings } from '@/app/types/events';
import { MediaItem } from '@/app/types';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

interface RouteParams {
  params: {
    eventId: string;
  };
}

interface TableInput {
  number: number;
  seats: {
    position: number;
    playerId?: string;
    playerName?: string;
  }[];
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { eventId } = params;
    console.log('GET request received for eventId:', eventId);
    
    const session = await getServerSession(authOptions);
    console.log('Session state:', session ? 'Authenticated' : 'Unauthenticated');

    // Allow unauthenticated access for GET requests
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

    // If the event is ended, only allow access with authentication
    if (event.status === 'ENDED' && !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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
    console.log('[API] PATCH request received:', { eventId, data });

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
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

    // Validate settings based on event type
    if (data.settings) {
      switch (event.type) {
        case 'POKER':
          if (!isPokerSettings(data.settings)) {
            return NextResponse.json(
              { error: 'Invalid poker settings format' },
              { status: 400 }
            );
          }
          break;
        case 'BASKETBALL':
          if (!isBasketballSettings(data.settings)) {
            return NextResponse.json(
              { error: 'Invalid basketball settings format' },
              { status: 400 }
            );
          }
          break;
        case 'CUSTOM':
          if (!isCustomSettings(data.settings)) {
            return NextResponse.json(
              { error: 'Invalid custom settings format' },
              { status: 400 }
            );
          }
          break;
      }
    }

    // If tables are provided, validate and update them
    if (data.tables) {
      // Delete existing tables and seats
      await prisma.table.deleteMany({
        where: {
          eventId
        }
      });
    }

    // Update the event with validated data
    const updateData = {
      ...(data.status && { status: data.status }),
      ...(data.settings && { settings: data.settings }),
      ...(data.startedAt && { startedAt: new Date(data.startedAt) }),
      ...(data.name && { name: data.name }),
      ...(data.displaySettings && { displaySettings: data.displaySettings }),
      ...(data.status === 'ENDED' && { endedAt: new Date() }),
      ...(data.mediaItems && {
        mediaItems: {
          deleteMany: {},
          create: data.mediaItems.map((item: Omit<MediaItem, 'id'>) => ({
            type: item.type,
            url: item.url,
            displayOrder: item.displayOrder,
            duration: item.duration
          }))
        }
      }),
      ...(data.tables && {
        tables: {
          create: (data.tables as TableInput[]).map((table) => ({
            number: table.number,
            seats: {
              create: table.seats.map((seat) => ({
                position: seat.position,
                playerId: seat.playerId,
                playerName: seat.playerName
              }))
            }
          }))
        }
      })
    };

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
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

    console.log('[API] Event updated successfully:', {
      id: updatedEvent.id,
      status: updatedEvent.status,
      settings: updatedEvent.settings
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('[API] Error updating event:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update event',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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
      // Delete tables and their seats
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