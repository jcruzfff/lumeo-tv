import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    eventId: string;
  };
}

// Add a new table
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { eventId } = params;

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
        seats: Array.from({ length: 9 }).map((_, i) => ({
          id: crypto.randomUUID(),
          position: i + 1
        }))
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

    // Get the table's current number
    const table = await prisma.table.findUnique({
      where: {
        id: tableId
      }
    });

    if (!table) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    // Delete the table
    await prisma.table.delete({
      where: {
        id: tableId
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

    const table = await prisma.table.update({
      where: {
        id: tableId
      },
      data: {
        seats
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