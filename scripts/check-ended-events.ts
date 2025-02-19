import { PrismaClient } from '@prisma/client';
import { PokerTimerState, BasketballTimerState } from '../app/types';

const prisma = new PrismaClient();

async function checkEndedEvents() {
  try {
    // Get all active events
    const activeEvents = await prisma.event.findMany({
      where: {
        status: 'ACTIVE'
      }
    });

    console.log(`Checking ${activeEvents.length} active events...`);

    for (const event of activeEvents) {
      const settings = event.settings as any;
      let shouldEnd = false;
      let finalSettings = {};

      if (event.type === 'BASKETBALL') {
        const basketballSettings = settings as BasketballTimerState;
        // End if time is up and we're in the last period
        if (basketballSettings.gameTime <= 0 && 
            basketballSettings.period >= basketballSettings.totalPeriods &&
            !basketballSettings.isRunning) {
          shouldEnd = true;
          finalSettings = {
            ...basketballSettings,
            gameTime: 0,
            isRunning: false,
            winningTeam: basketballSettings.homeScore > basketballSettings.awayScore ? 'Home' : 
                        basketballSettings.awayScore > basketballSettings.homeScore ? 'Away' : 'Tie',
            finalScore: {
              home: basketballSettings.homeScore,
              away: basketballSettings.awayScore
            }
          };
        }
      } else if (event.type === 'POKER') {
        const pokerSettings = settings as PokerTimerState;
        // End if time is up and we're in the last level
        if (pokerSettings.timeRemaining <= 0 && 
            pokerSettings.currentLevel >= pokerSettings.levels.length - 1 &&
            !pokerSettings.isRunning) {
          shouldEnd = true;
          finalSettings = {
            ...pokerSettings,
            isRunning: false,
            gameDetails: {
              totalLevels: pokerSettings.levels.length,
              currentLevel: pokerSettings.currentLevel,
              totalPlayTime: pokerSettings.totalPlayTime
            }
          };
        }
      }

      if (shouldEnd) {
        console.log(`Ending event: ${event.id} (${event.type})`);
        
        // Update event status to ENDED
        await prisma.event.update({
          where: { id: event.id },
          data: {
            status: 'ENDED',
            endedAt: new Date(),
            settings: finalSettings
          }
        });

        // Broadcast event end to all display windows
        if (typeof window !== 'undefined') {
          const bc = new BroadcastChannel('lumeo-events');
          bc.postMessage({ type: 'END_EVENT', eventId: event.id });
          bc.close();
        }

        console.log(`Event ${event.id} moved to history`);
      }
    }

    console.log('Finished checking events');
  } catch (error) {
    console.error('Error checking ended events:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkEndedEvents();
