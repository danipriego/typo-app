import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { existsSync } from 'fs';

export async function POST() {
  try {
    // Check for files with invalid paths
    const allFiles = await prisma.file.findMany();
    const invalidFiles = allFiles.filter(file => 
      file.filepath.includes('./test/data/') || 
      !existsSync(file.filepath)
    );

    // Remove invalid files and their analyses
    for (const invalidFile of invalidFiles) {
      // Delete related analyses first (foreign key constraint)
      await prisma.analysis.deleteMany({
        where: { fileId: invalidFile.id }
      });
      
      // Delete from cache
      await prisma.analysisCache.deleteMany({
        where: { fileHash: invalidFile.fileHash }
      });
      
      // Delete the file record
      await prisma.file.delete({
        where: { id: invalidFile.id }
      });
    }

    // Clear all analysis cache (to ensure no bad data remains)
    await prisma.analysisCache.deleteMany({});
    
    // Clear all analysis records (to ensure fresh start)
    await prisma.analysis.deleteMany({});

    // Get current valid files
    const validFiles = await prisma.file.findMany({
      select: {
        id: true,
        filename: true,
        originalName: true,
        filepath: true,
        fileSize: true,
        uploadedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${invalidFiles.length} invalid files and cleared all caches`,
      invalidFilesRemoved: invalidFiles.map(f => ({ 
        id: f.id, 
        filepath: f.filepath 
      })),
      validFilesRemaining: validFiles.length,
      validFiles: validFiles
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Cleanup failed'
    }, { status: 500 });
  }
} 