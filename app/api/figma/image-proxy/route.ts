import { NextRequest, NextResponse } from 'next/server';
import { getFigmaAccessToken } from '@/lib/figma-token';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileId, nodeId, scale = 0.5 } = body;

    if (!fileId || !nodeId) {
      return NextResponse.json(
        { error: 'fileId and nodeId are required' },
        { status: 400 }
      );
    }

    const figmaAccessToken = await getFigmaAccessToken();

    if (!figmaAccessToken) {
      return NextResponse.json(
        { error: 'Figma access token not configured. Please add FIGMA_ACCESS_TOKEN to your environment variables or update it in Settings.' },
        { status: 500 }
      );
    }

    // Пробуем получить изображение с заданным масштабом
    const imageResponse = await fetch(
      `https://api.figma.com/v1/images/${fileId}?ids=${nodeId}&format=jpg&scale=${scale}`,
      {
        headers: {
          'X-Figma-Token': figmaAccessToken,
        },
      }
    );

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error('Figma API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch image from Figma', details: errorText },
        { status: imageResponse.status }
      );
    }

    const imageData = await imageResponse.json();
    const imageUrl = imageData.images[nodeId];

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image not found in Figma response' },
        { status: 404 }
      );
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Error in image proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('fileId');
  const nodeId = searchParams.get('nodeId');
  const scaleParam = searchParams.get('scale');
  const formatParam = searchParams.get('format');

  // scale: 0.1..4 (Figma API), default smaller for faster thumbs
  const scale = Math.min(4, Math.max(0.1, parseFloat(scaleParam || '0.5')));
  // Only jpg or png are supported by Figma images API
  const format = formatParam === 'png' ? 'png' : 'jpg';

  if (!fileId || !nodeId) {
    return NextResponse.json(
      { error: 'fileId and nodeId are required' },
      { status: 400 }
    );
  }

  try {
    // Используем getFigmaAccessToken() для получения токена из БД или .env
    const figmaAccessToken = await getFigmaAccessToken();

    if (!figmaAccessToken) {
      console.error('Figma access token not configured');
      // Возвращаем SVG placeholder вместо ошибки
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b7280" font-family="Arial, Helvetica, sans-serif" font-size="20">No Token</text></svg>`;
      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=60',
        },
      });
    }

    // Get image URL from Figma (encode nodeId to handle colon-separated ids)
    const encodedNodeId = encodeURIComponent(nodeId);
    const figmaUrl = `https://api.figma.com/v1/images/${fileId}?ids=${encodedNodeId}&format=${format}&scale=${scale}`;
    
    const imageResponse = await fetch(
      figmaUrl,
      {
        headers: {
          'X-Figma-Token': figmaAccessToken,
        },
      }
    );

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      let errorDetails = '';
      
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = errorJson.err || errorJson.message || errorText;
      } catch {
        errorDetails = errorText;
      }

      console.error(`Figma API error ${imageResponse.status} for file ${fileId}, node ${nodeId}:`, errorDetails);

      // Специальная обработка для разных типов ошибок
      if (imageResponse.status === 403) {
        console.error(`❌ Access denied (403) to file ${fileId}. Possible reasons:
          1. Token doesn't have access to this file
          2. File is private and token lacks permissions
          3. Token expired or invalid
          4. File was moved or deleted`);
      } else if (imageResponse.status === 404) {
        console.error(`❌ File ${fileId} or node ${nodeId} not found`);
      }

      // Возвращаем SVG placeholder вместо ошибки, чтобы не ломать UI
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
        <rect width="100%" height="100%" fill="#fee2e2"/>
        <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="#dc2626" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="bold">Preview Unavailable</text>
        <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="#991b1b" font-family="Arial, Helvetica, sans-serif" font-size="12">Error ${imageResponse.status}</text>
      </svg>`;
      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=300', // Кэшируем ошибки на 5 минут
        },
      });
    }

    const imageData = await imageResponse.json();
    const imageUrl = imageData.images[nodeId] || imageData.images[decodeURIComponent(encodedNodeId)] || imageData.images[Object.keys(imageData.images)[0]];

    if (!imageUrl) {
      console.error(`Image URL not found in Figma response for node ${nodeId}`);
      // Возвращаем SVG placeholder
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b7280" font-family="Arial, Helvetica, sans-serif" font-size="20">No Image</text></svg>`;
      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    // Option 1: Redirect to Figma CDN URL (fast path, lets browser cache it)
    return NextResponse.redirect(imageUrl, 302);

  } catch (error) {
    console.error('Error fetching Figma image:', error);

    // Inline SVG placeholder to avoid external DNS failures
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b7280" font-family="Arial, Helvetica, sans-serif" font-size="20">Slide</text></svg>`;
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=600',
      },
    });
  }
} 