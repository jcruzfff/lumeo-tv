import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/app/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/auth.config'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  console.log('POST request received to create new event')
  
  try {
    const session = await getServerSession(authOptions)
    console.log('Session state:', session)

    if (!session) {
      console.log('Unauthorized access attempt - No session found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    const { name, type, settings } = body

    if (!name || !type || !settings) {
      console.log('Missing required fields:', { name, type, settings })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find an admin user to associate with the event
    console.log('Looking for admin user with email:', session.user?.email)
    const adminUser = await prisma.user.findFirst({
      where: {
        isAdmin: true
      }
    });

    console.log('Found admin user:', adminUser)

    // If no admin user found, let's check all users
    if (!adminUser) {
      const allUsers = await prisma.user.findMany();
      console.log('All users in database:', allUsers);
    }

    if (!adminUser) {
      console.log('No admin user found')
      return NextResponse.json(
        { error: 'No admin user found to create event' },
        { status: 400 }
      );
    }

    console.log('Creating event with data:', {
      name,
      type,
      settings,
      creatorId: adminUser.id
    })

    const event = await prisma.event.create({
      data: {
        name,
        type,
        settings,
        status: 'ACTIVE',
        startedAt: new Date(),
        creatorId: adminUser.id
      },
      include: {
        mediaItems: true,
        tables: true,
        waitingList: true,
        creator: true
      },
    })

    console.log('Event created successfully:', event)
    return NextResponse.json(event)
  } catch (error) {
    console.error('Error in POST /api/events:', error)
    return NextResponse.json(
      { error: 'Error creating event' },
      { status: 500 }
    )
  }
}

export async function GET() {
  console.log('GET request received to fetch all events')
  
  try {
    const session = await getServerSession(authOptions)
    console.log('Session state:', session ? 'Authenticated' : 'Unauthenticated')

    if (!session) {
      console.log('Unauthorized access attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const events = await prisma.event.findMany({
      include: {
        mediaItems: true,
        tables: true,
        waitingList: true,
        creator: true
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log('Successfully fetched', events.length, 'events')
    return NextResponse.json(events)
  } catch (error) {
    console.error('Error in GET /api/events:', error)
    return NextResponse.json(
      { error: 'Error fetching events' },
      { status: 500 }
    )
  }
} 