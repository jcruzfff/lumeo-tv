import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    eventId: string;
  };
}

// Add media items
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { eventId } = params;
    const { items } = await request.json();

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid media items' },
        { status: 400 }
      );
    }

    // Get the current highest display order
    const lastItem = await prisma.mediaItem.findFirst({
      where: {
        eventId
      },
      orderBy: {
        displayOrder: 'desc'
      }
    });

    let displayOrder = (lastItem?.displayOrder ?? 0) + 1;

    // Create all media items
    const mediaItems = await Promise.all(
      items.map(async (item) => {
        const mediaItem = await prisma.mediaItem.create({
          data: {
            eventId,
            type: item.type,
            url: item.url,
            displayOrder: displayOrder++,
            duration: item.duration
          }
        });
        return mediaItem;
      })
    );

    return NextResponse.json(mediaItems);
  } catch (error) {
    console.error('Error adding media items:', error);
    return NextResponse.json(
      { error: 'Failed to add media items' },
      { status: 500 }
    );
  }
}

// Remove media items
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { eventId } = params;
    const { itemIds } = await request.json();

    // Validate itemIds array
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid media item IDs' },
        { status: 400 }
      );
    }

    // Delete the media items
    await prisma.mediaItem.deleteMany({
      where: {
        id: {
          in: itemIds
        },
        eventId
      }
    });

    // Reorder remaining items
    const remainingItems = await prisma.mediaItem.findMany({
      where: {
        eventId
      },
      orderBy: {
        displayOrder: 'asc'
      }
    });

    await Promise.all(
      remainingItems.map(async (item, index) => {
        await prisma.mediaItem.update({
          where: {
            id: item.id
          },
          data: {
            displayOrder: index + 1
          }
        });
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing media items:', error);
    return NextResponse.json(
      { error: 'Failed to remove media items' },
      { status: 500 }
    );
  }
}

// Reorder media items
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { eventId } = params;
    const { itemId, newOrder } = await request.json();

    // Get the item's current order
    const item = await prisma.mediaItem.findUnique({
      where: {
        id: itemId
      }
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Media item not found' },
        { status: 404 }
      );
    }

    // Update display orders
    if (newOrder > item.displayOrder) {
      // Moving down the list
      await prisma.mediaItem.updateMany({
        where: {
          eventId,
          displayOrder: {
            gt: item.displayOrder,
            lte: newOrder
          }
        },
        data: {
          displayOrder: {
            decrement: 1
          }
        }
      });
    } else if (newOrder < item.displayOrder) {
      // Moving up the list
      await prisma.mediaItem.updateMany({
        where: {
          eventId,
          displayOrder: {
            gte: newOrder,
            lt: item.displayOrder
          }
        },
        data: {
          displayOrder: {
            increment: 1
          }
        }
      });
    }

    // Update the item's order
    await prisma.mediaItem.update({
      where: {
        id: itemId
      },
      data: {
        displayOrder: newOrder
      }
    });

    // Get all media items in the new order
    const mediaItems = await prisma.mediaItem.findMany({
      where: {
        eventId
      },
      orderBy: {
        displayOrder: 'asc'
      }
    });

    return NextResponse.json(mediaItems);
  } catch (error) {
    console.error('Error reordering media items:', error);
    return NextResponse.json(
      { error: 'Failed to reorder media items' },
      { status: 500 }
    );
  }
} 