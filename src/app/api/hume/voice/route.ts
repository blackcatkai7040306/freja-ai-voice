import { NextRequest, NextResponse } from 'next/server';
import { HumeClient } from 'hume';

/**
 * API route for handling Hume AI voice interactions
 * Processes audio input and returns AI response with emotion analysis
 */

const humeClient = new HumeClient({
  apiKey: process.env.HUME_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    // if (!process.env.HUME_API_KEY) {
    //   console.error('HUME_API_KEY environment variable not configured');
    //   return NextResponse.json(
    //     { 
    //       error: 'Hume API key not configured. Please set the HUME_API_KEY environment variable.' 
    //     },
    //     { status: 500 }
    //   );
    // }

    // Parse multipart form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    console.log('audioFile', audioFile);
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided in the request' },
        { status: 400 }
      );
    }

    // Validate audio file
    if (audioFile.size === 0) {
      return NextResponse.json(
        { error: 'Audio file is empty' },
        { status: 400 }
      );
    }

    if (audioFile.size > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json(
        { error: 'Audio file too large. Maximum size is 10MB.' },
        { status: 413 }
      );
    }

    // Convert file to buffer for Hume API
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    try {
      // Note: This is a placeholder for Hume AI EVI (Emotional Voice Interface) integration
      // You'll need to implement the actual Hume EVI API calls based on their latest SDK
      // For now, we'll create a mock response structure
      
      const mockResponse = {
        response: "I understand you're speaking with me. How can I help you today?",
        emotions: [
          { name: 'joy', score: 0.7 },
          { name: 'excitement', score: 0.5 },
          { name: 'curiosity', score: 0.8 }
        ],
        // In a real implementation, this would be the audio response from Hume
        audioData: new ArrayBuffer(0)
      };

      return NextResponse.json(mockResponse);

      // TODO: Implement actual Hume EVI API integration
      // Example structure for when the SDK is properly integrated:
      /*
      const eviResponse = await humeClient.evi.chat({
        audio: audioBuffer,
        config_id: process.env.HUME_CONFIG_ID,
      });

      return NextResponse.json({
        response: eviResponse.text,
        emotions: eviResponse.emotions || [],
        audioData: eviResponse.audio || new ArrayBuffer(0),
      });
      */

    } catch (humeError) {
      console.error('Hume API error:', humeError);
      
      // Provide specific error message based on the error
      let errorMessage = 'Failed to process with Hume AI';
      if (humeError instanceof Error) {
        if (humeError.message.includes('unauthorized') || humeError.message.includes('401')) {
          errorMessage = 'Invalid Hume API key. Please check your API key configuration.';
        } else if (humeError.message.includes('rate limit') || humeError.message.includes('429')) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
        } else if (humeError.message.includes('network') || humeError.message.includes('timeout')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = `Hume API error: ${humeError.message}`;
        }
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 502 }
      );
    }

  } catch (error) {
    console.error('Voice API error:', error);
    
    // Provide specific error message based on the error
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      if (error.message.includes('FormData')) {
        errorMessage = 'Invalid request format. Please ensure audio data is sent correctly.';
      } else if (error.message.includes('permission') || error.message.includes('access')) {
        errorMessage = 'Permission denied. Please check your configuration.';
      } else {
        errorMessage = `Server error: ${error.message}`;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 