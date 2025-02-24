import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

interface UploadedFile {
  name: string;
  type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB limit for images
const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB limit for videos
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];

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
      files.map(async (file: UploadedFile) => {
        // Validate file type
        if (!ALLOWED_IMAGE_TYPES.includes(file.type) && !ALLOWED_VIDEO_TYPES.includes(file.type)) {
          throw new Error(`Invalid file type: ${file.type}`);
        }

        // Check file size
        const buffer = await file.arrayBuffer();
        const maxSize = file.type.startsWith('video/') ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
        
        if (buffer.byteLength > maxSize) {
          const sizeInMB = maxSize / (1024 * 1024);
          throw new Error(`File ${file.name} exceeds maximum size of ${sizeInMB}MB`);
        }

        // Generate unique filename
        const extension = file.name.split('.').pop();
        const filename = `${uuidv4()}.${extension}`;

        // Upload to Vercel Blob
        const { url } = await put(filename, buffer, {
          access: 'public',
          contentType: file.type
        });

        return {
          url,
          type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
          originalName: file.name
        };
      })
    );

    return NextResponse.json(uploadedFiles);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload files' },
      { status: 500 }
    );
  }
} 