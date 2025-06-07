import { NextResponse } from 'next/server';
import { checkAIServiceHealth } from '@/lib/ai-analysis';

export async function GET() {
  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        openai_connected: false,
        error: 'OpenAI API key not configured'
      });
    }

    // Check if API key has the correct format
    if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
      return NextResponse.json({
        openai_connected: false,
        error: 'Invalid API key format. OpenAI keys should start with "sk-"'
      });
    }

    // Test actual connection to OpenAI
    const isHealthy = await checkAIServiceHealth();
    
    if (isHealthy) {
      return NextResponse.json({
        openai_connected: true,
        message: 'OpenAI connection successful'
      });
    } else {
      return NextResponse.json({
        openai_connected: false,
        error: 'OpenAI API request failed. Check your API key and account status.'
      });
    }

  } catch (error) {
    console.error('OpenAI health check error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Unknown error occurred';
    
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        errorMessage = 'Invalid API key. Please check your OpenAI API key.';
      } else if (error.message.includes('429')) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({
      openai_connected: false,
      error: errorMessage
    });
  }
} 