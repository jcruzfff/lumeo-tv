import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Parse the multipart form data
    const formData = await request.formData();
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadedFiles = await Promise.all(
      files.map(async (file: any) => {
        // Generate a unique filename
        const uniqueId = uuidv4();
        const originalName = file.name;
        const extension = originalName.split('.').pop();
        const filename = `${uniqueId}.${extension}`;

        // Create the uploads directory if it doesn't exist
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        await writeFile(join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));

        // Return the URL for the uploaded file
        return {
          url: `/uploads/${filename}`,
          type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
          originalName
        };
      })
    );

    return NextResponse.json(uploadedFiles);
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload files' },
      { status: 500 }
    );
  }
} 