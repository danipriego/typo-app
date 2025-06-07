import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeDocument } from '@/lib/ai-analysis';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  console.log('🔍 Analysis API called');
  
  try {
    // Rate limiting check
    const rateLimitResult = await rateLimit(request);
    if (!rateLimitResult.allowed) {
      console.log('❌ Rate limit exceeded');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.info.retryAfter
        },
        { status: 429 }
      );
    }

    const { fileId, forceRefresh = false } = await request.json();
    console.log('📋 Request data:', { fileId, forceRefresh });

    if (!fileId) {
      console.log('❌ No file ID provided');
      return NextResponse.json(
        { success: false, error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Get file from database
    console.log('🔍 Looking up file in database:', fileId);
    const file = await prisma.file.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      console.log('❌ File not found in database');
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    console.log('✅ File found:', { 
      filename: file.filename, 
      originalName: file.originalName,
      fileSize: file.fileSize,
      filepath: file.filepath 
    });

    // Check cache unless forced refresh
    if (!forceRefresh) {
      console.log('🔍 Checking cache for file hash:', file.fileHash);
      const cachedAnalysis = await prisma.analysisCache.findUnique({
        where: {
          fileHash: file.fileHash,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      if (cachedAnalysis) {
        console.log('✅ Found cached analysis, returning cached result');
        return NextResponse.json({
          success: true,
          data: JSON.parse(cachedAnalysis.analysisResult),
          cached: true
        });
      } else {
        console.log('ℹ️ No cached analysis found, proceeding with new analysis');
      }
    }

    // Start analysis process
    console.log('🚀 Starting document analysis...');
    try {
      const analysisResult = await analyzeDocument(file);
      console.log('✅ Analysis completed successfully:', {
        overallScore: analysisResult.overall_score,
        fontSizesDetected: analysisResult.font_sizes_detected,
        exceedsSizeLimit: analysisResult.exceeds_size_limit
      });

      // Save analysis to database
      console.log('💾 Saving analysis to database...');
      await prisma.analysis.create({
        data: {
          fileId: file.id,
          analysisData: JSON.stringify(analysisResult),
          fontSizesDetected: analysisResult.font_sizes_detected,
          exceedsSizeLimit: analysisResult.exceeds_size_limit,
          overallScore: analysisResult.overall_score
        }
      });

      // Cache the result
      console.log('💾 Caching analysis result...');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await prisma.analysisCache.upsert({
        where: { fileHash: file.fileHash },
        update: {
          analysisResult: JSON.stringify(analysisResult),
          expiresAt
        },
        create: {
          fileHash: file.fileHash,
          analysisResult: JSON.stringify(analysisResult),
          expiresAt
        }
      });

      console.log('✅ Analysis pipeline completed successfully');
      return NextResponse.json({
        success: true,
        data: analysisResult,
        cached: false
      });

    } catch (analysisError) {
      console.error('❌ Analysis error details:', {
        error: analysisError,
        message: analysisError instanceof Error ? analysisError.message : 'Unknown error',
        stack: analysisError instanceof Error ? analysisError.stack : undefined
      });
      return NextResponse.json(
        { success: false, error: 'Analysis failed. Please try again.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ API error details:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 