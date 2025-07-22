import { NextRequest, NextResponse } from 'next/server';
import { fetchAccessToken } from 'hume';

/**
 * API route for fetching Hume AI access tokens
 * Required for authenticating with Hume's Empathic Voice Interface (EVI)
 */
export async function POST(request: NextRequest) {
  try {
    // Check if API key and secret are configured
    if (!process.env.HUME_API_KEY || !process.env.HUME_SECRET_KEY) {
      console.error('Missing Hume API credentials');
      return NextResponse.json(
        { 
          error: 'Hume API credentials not configured. Please set HUME_API_KEY and HUME_SECRET_KEY environment variables.' 
        },
        { status: 500 }
      );
    }

    // Fetch access token from Hume AI
    const accessToken = await fetchAccessToken({
      apiKey: process.env.HUME_API_KEY,
      secretKey: process.env.HUME_SECRET_KEY,
    });

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Failed to obtain access token from Hume AI' },
        { status: 500 }
      );
    }

    return NextResponse.json({ accessToken });

  } catch (error) {
    console.error('Access token fetch error:', error);
    
    let errorMessage = 'Failed to fetch access token';
    if (error instanceof Error) {
      if (error.message.includes('unauthorized') || error.message.includes('401')) {
        errorMessage = 'Invalid Hume API credentials. Please check your API key and secret.';
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        errorMessage = `Authentication error: ${error.message}`;
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