import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    eventId: string;
  };
}

interface EventSettings {
  timeRemaining?: number;
  currentLevel?: number;
  levels?: { smallBlind: number; bigBlind: number }[];
  gameTime?: number;
  period?: number;
  totalPeriods?: number;
  homeScore?: number;
  awayScore?: number;
  isRunning?: boolean;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { eventId } = params;
    const { action, time } = await request.json();

    const event = await prisma.event.findUnique({
      where: {
        id: eventId
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const currentSettings = event.settings as EventSettings;

    // Handle different timer actions
    switch (action) {
      case 'start':
        await prisma.event.update({
          where: {
            id: eventId
          },
          data: {
            settings: {
              ...currentSettings,
              isRunning: true
            }
          }
        });
        break;

      case 'update':
        if (typeof time !== 'number') {
          return NextResponse.json(
            { error: 'Invalid time value' },
            { status: 400 }
          );
        }

        await prisma.event.update({
          where: {
            id: eventId
          },
          data: {
            settings: {
              ...currentSettings,
              timeRemaining: time
            }
          }
        });
        break;

      case 'next_level':
        if (event.type !== 'POKER') {
          return NextResponse.json(
            { error: 'Action only available for poker events' },
            { status: 400 }
          );
        }

        const nextLevel = (currentSettings.currentLevel ?? 0) + 1;
        if (nextLevel >= (currentSettings.levels?.length ?? 0)) {
          return NextResponse.json(
            { error: 'No more levels available' },
            { status: 400 }
          );
        }

        await prisma.event.update({
          where: {
            id: eventId
          },
          data: {
            settings: {
              ...currentSettings,
              currentLevel: nextLevel,
              timeRemaining: time ?? currentSettings.timeRemaining
            }
          }
        });
        break;

      case 'next_period':
        if (event.type !== 'BASKETBALL') {
          return NextResponse.json(
            { error: 'Action only available for basketball events' },
            { status: 400 }
          );
        }

        const nextPeriod = (currentSettings.period ?? 1) + 1;
        if (nextPeriod > (currentSettings.totalPeriods ?? 4)) {
          return NextResponse.json(
            { error: 'No more periods available' },
            { status: 400 }
          );
        }

        await prisma.event.update({
          where: {
            id: eventId
          },
          data: {
            settings: {
              ...currentSettings,
              period: nextPeriod,
              gameTime: time ?? currentSettings.gameTime
            }
          }
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Get the updated event
    const updatedEvent = await prisma.event.findUnique({
      where: {
        id: eventId
      }
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Error managing timer:', error);
    return NextResponse.json(
      { error: 'Failed to manage timer' },
      { status: 500 }
    );
  }
} 