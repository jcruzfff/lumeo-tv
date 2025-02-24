import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { broadcastEventUpdate } from '../../ws/route';

interface RouteParams {
  params: {
    eventId: string;
  };
}

// Add a player to the waiting list
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const eventId = await Promise.resolve(params.eventId);
    const { name } = await request.json();

    console.log('[Waitlist API] Adding player:', { eventId, name });

    // Validate input
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      );
    }

    // Get the current highest position
    const lastPlayer = await prisma.player.findFirst({
      where: {
        eventId
      },
      orderBy: {
        position: 'desc'
      }
    });

    const nextPosition = (lastPlayer?.position ?? 0) + 1;
    console.log('[Waitlist API] Calculated next position:', nextPosition);

    // Create the new player
    const player = await prisma.player.create({
      data: {
        eventId,
        name: name.trim(),
        position: nextPosition,
        addedAt: new Date()
      }
    });

    // Get updated waitlist
    const updatedWaitlist = await prisma.player.findMany({
      where: { eventId },
      orderBy: { position: 'asc' }
    });

    // Broadcast the update
    broadcastEventUpdate(eventId, { waitingList: updatedWaitlist });

    console.log('[Waitlist API] Created player:', player);
    return NextResponse.json(player);
  } catch (error) {
    console.error('[Waitlist API] Error adding player:', error);
    return NextResponse.json(
      { error: 'Failed to add player to waiting list' },
      { status: 500 }
    );
  }
}

// Remove a player from the waiting list
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const eventId = params.eventId;
    const { playerId } = await request.json();

    await prisma.player.delete({
      where: {
        id: playerId
      }
    });

    // Get updated waitlist
    const updatedWaitlist = await prisma.player.findMany({
      where: { eventId },
      orderBy: { position: 'asc' }
    });

    // Broadcast the update
    broadcastEventUpdate(eventId, { waitingList: updatedWaitlist });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Waitlist API] Error removing player:', error);
    return NextResponse.json(
      { error: 'Failed to remove player from waiting list' },
      { status: 500 }
    );
  }
}

// Reorder the waiting list
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { eventId } = params;
    const { playerId, newPosition } = await request.json();

    // Get the player's current position
    const player = await prisma.player.findUnique({
      where: {
        id: playerId
      }
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Update positions
    if (newPosition > player.position) {
      // Moving down the list
      await prisma.player.updateMany({
        where: {
          eventId,
          position: {
            gt: player.position,
            lte: newPosition
          }
        },
        data: {
          position: {
            decrement: 1
          }
        }
      });
    } else if (newPosition < player.position) {
      // Moving up the list
      await prisma.player.updateMany({
        where: {
          eventId,
          position: {
            gte: newPosition,
            lt: player.position
          }
        },
        data: {
          position: {
            increment: 1
          }
        }
      });
    }

    // Update the player's position
    await prisma.player.update({
      where: {
        id: playerId
      },
      data: {
        position: newPosition
      }
    });

    // Get updated waitlist
    const updatedWaitlist = await prisma.player.findMany({
      where: { eventId },
      orderBy: { position: 'asc' }
    });

    // Broadcast the update
    broadcastEventUpdate(eventId, { waitingList: updatedWaitlist });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering waiting list:', error);
    return NextResponse.json(
      { error: 'Failed to reorder waiting list' },
      { status: 500 }
    );
  }
} 