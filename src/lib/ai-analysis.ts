import OpenAI from 'openai';
import { SYSTEM_PROMPTS, AIResponseSchema, type AIAnalysisResponse } from './ai-prompts';
import { AI_CONFIG } from './ai-config';
import type { File } from '@prisma/client';
import sharp from 'sharp'; // For image optimization

// Helper function to get OpenAI client
function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Image preprocessing for maximum quality
async function preprocessImage(fileUrl: string, originalSize: number): Promise<Buffer> {
  console.log('🔧 Preprocessing image for optimal quality...');
  
  // Fetch image from Vercel Blob URL
  const response = await fetch(fileUrl);
  const imageBuffer = Buffer.from(await response.arrayBuffer());
  
  // Use Sharp for lossless optimization
  const processedImage = await sharp(imageBuffer)
    .png({ 
      quality: 100,
      compressionLevel: 0, // No compression
      progressive: false,
      adaptiveFiltering: false
    })
    .resize(null, null, {
      fit: 'inside',
      withoutEnlargement: true // Don't upscale
    })
    .toBuffer();

  console.log('✅ Image preprocessing complete:', {
    originalSize,
    processedSize: processedImage.length,
    qualityPreserved: true
  });

  return processedImage;
}

// Convert PDF to high-quality image for vision analysis
async function convertPdfToImage(fileUrl: string): Promise<Buffer> {
  console.log('📄 Converting PDF to high-quality image for vision analysis...');
  
  try {
    // Fetch PDF from Vercel Blob URL
    const response = await fetch(fileUrl);
    const data = await response.arrayBuffer();
    
    // Dynamic import to avoid SSR issues
    const pdfParse = (await import('pdf2pic')).default;
    
    // Convert first page to high-quality PNG
    const convert = pdfParse.fromBuffer(Buffer.from(data), {
      density: 300, // High DPI for font clarity
      saveFilename: "temp",
      savePath: "/tmp", // Use system temp directory
      format: "png",
      width: 2400, // High resolution for font detection
      height: 3200
    });

    const result = await convert(1, { responseType: "buffer" });
    
    if (!result.buffer) {
      throw new Error('PDF conversion failed - no buffer returned');
    }

    console.log('✅ PDF converted to high-quality image:', {
      bufferSize: result.buffer.length,
      density: '300 DPI',
      resolution: '2400x3200'
    });

    return result.buffer;
    
  } catch (error) {
    console.error('❌ PDF conversion error:', error);
    throw new Error('Failed to convert PDF for analysis');
  }
}

// Main analysis function
export async function analyzeDocument(file: File): Promise<AIAnalysisResponse> {
  console.log('🤖 Starting AI document analysis for:', file.originalName);
  
  const openai = getOpenAIClient();
  
  try {
    let imageBuffer: Buffer;
    
    // Process based on file type
    if (file.mimeType === 'image/png') {
      console.log('🖼️ Processing PNG image...');
      imageBuffer = await preprocessImage(file.filepath, file.fileSize);
    } else if (file.mimeType === 'application/pdf') {
      console.log('📄 Processing PDF document...');
      imageBuffer = await convertPdfToImage(file.filepath);
    } else {
      throw new Error(`Unsupported file type: ${file.mimeType}`);
    }

    // Convert to base64 for OpenAI Vision API
    const base64Image = imageBuffer.toString('base64');
    console.log('🔄 Prepared image for AI analysis:', {
      bufferSize: imageBuffer.length,
      base64Length: base64Image.length
    });

    // Make API call with retry logic
    console.log('🚀 Sending to OpenAI Vision API...');
    
    const response = await openai.chat.completions.create({
      model: AI_CONFIG.MODEL,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPTS.UI_ANALYSIS
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this design image and provide a detailed typography assessment focusing on font size counting and type scale compliance."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
                detail: "high" // High detail for font analysis
              }
            }
          ]
        }
      ],
      max_completion_tokens: AI_CONFIG.MAX_COMPLETION_TOKENS,
      response_format: { type: 'json_object' }
    });

    const aiResponse = response.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    console.log('🤖 Raw AI Response:', aiResponse);

    // Parse and validate the response
    let parsedResponse: AIAnalysisResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
      console.log('✅ Parsed AI response successfully');
    } catch (parseError) {
      console.error('❌ Failed to parse AI response as JSON:', parseError);
      throw new Error('Invalid AI response format');
    }

    // Validate with Zod schema
    const validatedResponse = AIResponseSchema.parse(parsedResponse);
    console.log('✅ AI response validation passed');
    
    console.log('🎯 Analysis completed:', {
      fontSizesDetected: validatedResponse.font_sizes_detected,
      exceedsSizeLimit: validatedResponse.exceeds_size_limit,
      overallScore: validatedResponse.overall_score
    });

    return validatedResponse;

  } catch (error) {
    console.error('❌ AI Analysis Error:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    if (error instanceof Error && error.message.includes('rate limit')) {
      throw new Error('AI service rate limit reached. Please try again in a moment.');
    }
    
    throw new Error('AI analysis failed. Please try again.');
  }
}

export async function checkAIServiceHealth(): Promise<boolean> {
  try {
    const openai = getOpenAIClient();
    await openai.chat.completions.create({
      model: 'o3',
      messages: [{ role: 'user', content: 'test' }],
      max_completion_tokens: 5
      // Removed temperature - o3 only supports default (1)
    });
    return true;
  } catch {
    return false;
  }
} 