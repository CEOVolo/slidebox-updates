import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get('url');
    
    if (!imageUrl) {
    return new NextResponse('Missing URL parameter', { status: 400 });
    }

  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer'
    });
    
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    const contentType = response.headers['content-type'] || 'image/png';
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({ base64: dataUrl });
  } catch (error) {
    console.error(`Error fetching image for base64 conversion: ${imageUrl}`, error);
    return new NextResponse('Error fetching image', { status: 500 });
  }
}

// OPTIONS метод для CORS - БОЛЬШЕ НЕ НУЖЕН, обрабатывается в next.config.js
/*
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 
*/ 