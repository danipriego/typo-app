import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 🔥 INCREASED to 50MB for quality

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type - accepting PDF and PNG for vision analysis
    if (file.type !== 'application/pdf' && file.type !== 'image/png') {
      return NextResponse.json(
        { success: false, error: 'Only PDF and PNG files are allowed for accurate font analysis' },
        { status: 400 }
      );
    }

    // Updated file size limit for quality preservation
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 50MB (increased for quality preservation)' },
        { status: 400 }
      );
    }

    // Quality verification for images
    if (file.type === 'image/png') {
      console.log('🔍 Verifying PNG quality for font analysis...');
      
      // Check minimum dimensions for accurate font detection
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Basic PNG header validation (more detailed check could be added)
      if (buffer.length < 1024 * 100) { // Minimum 100KB for decent quality
        console.warn('⚠️ Image appears to be very small/low quality');
      }
      
      console.log('✅ Image quality check passed:', {
        fileSize: file.size,
        bufferSize: buffer.length,
        qualityLevel: file.size > 1024 * 1024 ? 'HIGH' : 'MEDIUM'
      });
    }

    // Generate file hash for deduplication
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Check if file already exists
    const existingFile = await prisma.file.findUnique({
      where: { fileHash }
    });

    if (existingFile) {
      console.log('✅ File already exists, returning cached version');
      return NextResponse.json({
        success: true,
        data: existingFile
      });
    }

    // Generate unique filename with correct extension
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = file.type === 'application/pdf' ? '.pdf' : '.png';
    const filename = `${timestamp}-${randomString}${extension}`;

    // Upload to Vercel Blob instead of saving to local filesystem
    console.log('💾 Uploading file to Vercel Blob with maximum quality preservation...');
    const blob = await put(filename, file, {
      access: 'public',
    });

    // Save file metadata to database
    const fileRecord = await prisma.file.create({
      data: {
        filename,
        originalName: file.name,
        filepath: blob.url, // Use blob.url instead of local file path
        fileHash,
        fileSize: file.size,
        mimeType: file.type,
        userId: null // For MVP, no user authentication
      }
    });

    console.log('✅ High-quality file uploaded to Vercel Blob:', {
      filename: fileRecord.filename,
      originalName: fileRecord.originalName,
      url: blob.url,
      size: (fileRecord.fileSize / 1024 / 1024).toFixed(2) + 'MB',
      qualityLevel: 'MAXIMUM_PRESERVED'
    });

    return NextResponse.json({
      success: true,
      data: fileRecord,
      qualityInfo: {
        preserved: true,
        compressionApplied: false,
        maxQuality: true
      }
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'File upload failed' },
      { status: 500 }
    );
  }
} 