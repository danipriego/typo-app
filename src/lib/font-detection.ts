import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.min.js';

interface FontMeasurement {
  fontSize: number;
  fontFamily: string;
  textContent: string;
  position: { x: number; y: number; width: number; height: number };
  certainty: 'exact' | 'measured' | 'estimated';
}

interface PreciseFontAnalysis {
  fontSizes: number[];
  fontMeasurements: FontMeasurement[];
  totalUniqueSizes: number;
  analysisMethod: 'pdf-metadata' | 'image-analysis' | 'hybrid';
  confidence: number;
}

/**
 * Extract precise font information from PDF files using PDF.js metadata
 */
export async function analyzePDFFonts(fileUrl: string): Promise<PreciseFontAnalysis> {
  console.log('🔍 Analyzing PDF fonts with metadata extraction...');
  
  try {
    // Fetch PDF from Vercel Blob URL
    const response = await fetch(fileUrl);
    const data = await response.arrayBuffer();
    
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const fontMeasurements: FontMeasurement[] = [];
    const fontSizes = new Set<number>();

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      // Get text content with font information
      const textContent = await page.getTextContent();
      
      for (const item of textContent.items) {
        if ('fontSize' in item && 'fontName' in item && typeof item.fontSize === 'number') {
          const fontSize = Math.round(item.fontSize * 100) / 100; // Round to 2 decimal places
          fontSizes.add(fontSize);
          
          fontMeasurements.push({
            fontSize,
            fontFamily: item.fontName || 'unknown',
            textContent: item.str || '',
            position: {
              x: item.transform[4],
              y: item.transform[5],
              width: item.width || 0,
              height: item.height || 0
            },
            certainty: 'exact'
          });
        }
      }
    }

    const uniqueFontSizes = Array.from(fontSizes).sort((a, b) => b - a);
    
    console.log('✅ PDF font analysis complete:', {
      uniqueSizes: uniqueFontSizes.length,
      fontSizes: uniqueFontSizes,
      totalMeasurements: fontMeasurements.length
    });

    return {
      fontSizes: uniqueFontSizes,
      fontMeasurements,
      totalUniqueSizes: uniqueFontSizes.length,
      analysisMethod: 'pdf-metadata',
      confidence: 0.95 // High confidence for PDF metadata
    };

  } catch (error) {
    console.error('❌ PDF font analysis failed:', error);
    throw new Error(`PDF font analysis failed: ${error}`);
  }
}

/**
 * Analyze PNG images using canvas-based text detection
 * Note: Precise pixel-perfect font measurement from images is extremely complex
 * and requires sophisticated OCR + computer vision. This is a simplified approach.
 */
export async function analyzeImageFonts(): Promise<PreciseFontAnalysis> {
  console.log('🖼️ Analyzing image fonts - Note: Image analysis cannot provide exact measurements like PDF metadata can');
  
  // For now, we'll throw an error to indicate this needs more advanced implementation
  throw new Error('Precise font size detection from PNG images requires advanced OCR/Computer Vision libraries. For exact measurements, please use PDF files where font metadata is available. Image analysis can only provide estimates, not precise measurements.');

  /* Future implementation would require:
   * 1. Advanced OCR library (like Tesseract.js with font detection)
   * 2. Computer vision text region detection
   * 3. Machine learning models trained on font recognition
   * 4. Pixel-to-point conversion algorithms
   * 
   * For now, we recommend using AI analysis for images since it provides
   * reasonable estimates, or converting images to PDF format for precise analysis.
   */
}

/**
 * Main function to analyze fonts with the best available method
 */
export async function analyzeFontsWithPrecision(fileUrl: string, mimeType: string): Promise<PreciseFontAnalysis> {
  console.log('🎯 Starting precise font analysis:', { fileUrl, mimeType });
  
  if (mimeType === 'application/pdf') {
    // For PDFs, we can get exact font information from metadata
    return await analyzePDFFonts(fileUrl);
  } else if (mimeType === 'image/png') {
    // For images, we need computer vision approaches (less precise)
    return await analyzeImageFonts();
  } else {
    throw new Error(`Unsupported file type for precise font analysis: ${mimeType}`);
  }
}

/**
 * Convert font analysis to our existing AI response format
 */
export function convertToAIResponse(analysis: PreciseFontAnalysis) {
  const exceedsLimit = analysis.totalUniqueSizes > 4;
  const score = exceedsLimit ? Math.max(20, 100 - (analysis.totalUniqueSizes - 4) * 15) : 85;
  
  return {
    overall_score: score,
    font_sizes_detected: analysis.totalUniqueSizes,
    exceeds_size_limit: exceedsLimit,
    analysis: {
      type_scale_compliance: {
        score,
        feedback: `Precise analysis detected ${analysis.totalUniqueSizes} distinct font sizes using ${analysis.analysisMethod}. Confidence: ${(analysis.confidence * 100).toFixed(0)}%`,
        recommendations: exceedsLimit 
          ? [`Reduce from ${analysis.totalUniqueSizes} sizes to maximum 4 sizes`]
          : ['Font size count is within recommended limits'],
        detected_sizes: analysis.fontSizes.map(size => `${size}px`)
      },
      // TEMPORARILY DISABLED - FOCUSING ON TYPE SCALE ONLY
      hierarchy_effectiveness: {
        score: 100, // Fixed high score while disabled
        feedback: 'TEMPORARILY DISABLED - focusing on type scale compliance only',
        recommendations: ['Type scale analysis takes priority'],
        hierarchy_issues: []
      },
      consistency_application: {
        score: 100, // Fixed high score while disabled
        feedback: 'TEMPORARILY DISABLED - focusing on type scale compliance only',
        recommendations: ['Type scale analysis takes priority'],
        inconsistencies_found: []
      },
      readability_standards: {
        score: 100, // Fixed high score while disabled
        feedback: 'TEMPORARILY DISABLED - focusing on type scale compliance only',
        recommendations: ['Type scale analysis takes priority'],
        readability_issues: []
      }
      // END TEMPORARILY DISABLED SECTIONS
    },
    priority_issues: exceedsLimit 
      ? [`Critical: Using ${analysis.totalUniqueSizes} font sizes (max recommended: 4)`]
      : [],
    quick_wins: exceedsLimit 
      ? ['Consolidate similar font sizes to reduce total count']
      : ['Font size count is manageable'],
    compliance_summary: {
      passes_size_limit: !exceedsLimit,
      total_violations: exceedsLimit ? 1 : 0,
      severity_level: exceedsLimit ? 'high' as const : 'low' as const
    }
  };
} 