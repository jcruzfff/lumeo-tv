import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';

interface RouteParams {
  params: {
    eventId: string;
  };
}

// Add a new table
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { eventId } = params;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the current highest table number
    const lastTable = await prisma.table.findFirst({
      where: {
        eventId
      },
      orderBy: {
        number: 'desc'
      }
    });

    const newNumber = (lastTable?.number ?? 0) + 1;

    // Create a new table with 9 empty seats
    const table = await prisma.table.create({
      data: {
        eventId,
        number: newNumber,
        seats: {
          create: Array.from({ length: 9 }).map((_, i) => ({
            position: i + 1,
            playerId: null,
            playerName: null
          }))
        }
      },
      include: {
        seats: true
      }
    });

    return NextResponse.json(table);
  } catch (error) {
    console.error('Error adding table:', error);
    return NextResponse.json(
      { error: 'Failed to add table' },
      { status: 500 }
    );
  }
}

// Remove a table
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { eventId } = params;
    const { tableId } = await request.json();

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the table's current number
    const table = await prisma.table.findUnique({
      where: {
        id: tableId,
        eventId // Ensure table belongs to this event
      }
    });

    if (!table) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    // Delete the table and its seats (cascade delete configured in schema)
    await prisma.table.delete({
      where: {
        id: tableId,
        eventId // Additional safety check
      }
    });

    // Update numbers of remaining tables
    await prisma.table.updateMany({
      where: {
        eventId,
        number: {
          gt: table.number
        }
      },
      data: {
        number: {
          decrement: 1
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing table:', error);
    return NextResponse.json(
      { error: 'Failed to remove table' },
      { status: 500 }
    );
  }
}

// Update table seats
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { eventId } = params;
    const { tableId, seats } = await request.json();

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate table belongs to event
    const existingTable = await prisma.table.findUnique({
      where: {
        id: tableId,
        eventId
      }
    });

    if (!existingTable) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    // Validate seat data
    if (!Array.isArray(seats) || seats.length !== 9) {
      return NextResponse.json(
        { error: 'Invalid seats data. Must provide exactly 9 seats.' },
        { status: 400 }
      );
    }

    // Update seats
    const table = await prisma.table.update({
      where: {
        id: tableId,
        eventId
      },
      data: {
        seats: {
          deleteMany: {},
          create: seats.map((seat, index) => ({
            position: index + 1,
            playerId: seat.playerId || null,
            playerName: seat.playerName || null
          }))
        }
      },
      include: {
        seats: true
      }
    });

    return NextResponse.json(table);
  } catch (error) {
    console.error('Error updating table seats:', error);
    return NextResponse.json(
      { error: 'Failed to update table seats' },
      { status: 500 }
    );
  }
} 