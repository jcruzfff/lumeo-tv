import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    eventId: string;
  };
}

// Add a player to the waiting list
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { eventId } = params;
    const { name } = await request.json();

    // Get the current highest position
    const lastPlayer = await prisma.player.findFirst({
      where: {
        eventId
      },
      orderBy: {
        position: 'desc'
      }
    });

    const newPosition = (lastPlayer?.position ?? 0) + 1;

    const player = await prisma.player.create({
      data: {
        name,
        position: newPosition,
        eventId
      }
    });

    return NextResponse.json(player);
  } catch (error) {
    console.error('Error adding player to waiting list:', error);
    return NextResponse.json(
      { error: 'Failed to add player to waiting list' },
      { status: 500 }
    );
  }
}

// Remove a player from the waiting list
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { eventId } = params;
    const { playerId } = await request.json();

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

    // Delete the player
    await prisma.player.delete({
      where: {
        id: playerId
      }
    });

    // Update positions of remaining players
    await prisma.player.updateMany({
      where: {
        eventId,
        position: {
          gt: player.position
        }
      },
      data: {
        position: {
          decrement: 1
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing player from waiting list:', error);
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering waiting list:', error);
    return NextResponse.json(
      { error: 'Failed to reorder waiting list' },
      { status: 500 }
    );
  }
} 