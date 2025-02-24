import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    eventId: string;
    tableId: string;
    seatIndex: string;
  };
}

// Assign a player to a seat
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { eventId, tableId, seatIndex } = params;
    const { playerId } = await request.json();

    console.log('[Seats API] Assigning player to seat:', { eventId, tableId, seatIndex, playerId });

    // Get the table
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: { seats: true }
    });

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    // Update the seat
    const updatedSeat = await prisma.seat.update({
      where: {
        id: table.seats[parseInt(seatIndex)].id
      },
      data: {
        playerId,
        playerName: (await prisma.player.findUnique({ where: { id: playerId } }))?.name
      }
    });

    // Remove player from waiting list
    await prisma.player.delete({
      where: { id: playerId }
    });

    // Get updated tables and waiting list
    const [updatedTables, updatedWaitingList] = await Promise.all([
      prisma.table.findMany({
        where: { eventId },
        include: { seats: true },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.player.findMany({
        where: { eventId },
        orderBy: { position: 'asc' }
      })
    ]);

    console.log('[Seats API] Successfully assigned player');
    return NextResponse.json({ 
      tables: updatedTables,
      waitingList: updatedWaitingList
    });
  } catch (error) {
    console.error('[Seats API] Error assigning player:', error);
    return NextResponse.json(
      { error: 'Failed to assign player to seat' },
      { status: 500 }
    );
  }
}

// Remove a player from a seat
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { eventId, tableId, seatIndex } = params;

    console.log('[Seats API] Removing player from seat:', { eventId, tableId, seatIndex });

    // Get the table
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: { seats: true }
    });

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    // Update the seat
    const updatedSeat = await prisma.seat.update({
      where: {
        id: table.seats[parseInt(seatIndex)].id
      },
      data: {
        playerId: null,
        playerName: null
      }
    });

    // Get updated tables
    const updatedTables = await prisma.table.findMany({
      where: { eventId },
      include: { seats: true },
      orderBy: { createdAt: 'asc' }
    });

    console.log('[Seats API] Successfully removed player');
    return NextResponse.json({ 
      tables: updatedTables,
      waitingList: await prisma.player.findMany({
        where: { eventId },
        orderBy: { position: 'asc' }
      })
    });
  } catch (error) {
    console.error('[Seats API] Error removing player:', error);
    return NextResponse.json(
      { error: 'Failed to remove player from seat' },
      { status: 500 }
    );
  }
} 