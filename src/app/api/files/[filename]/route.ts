import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    // Find file by filename to get the blob URL
    const file = await prisma.file.findFirst({
      where: { filename }
    });

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Redirect to the Vercel Blob URL
    return NextResponse.redirect(file.filepath);
    
  } catch (error) {
    console.error('File serving error:', error);
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    );
  }
} 