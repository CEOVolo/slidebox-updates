import { NextRequest, NextResponse } from 'next/server';
import { metadataService } from '@/lib/metadata-service';

// GET - get all metadata
export async function GET() {
  try {
    const metadata = await metadataService.getAllMetadata();
    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
  }
}

// POST - invalidate cache
export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json();
    metadataService.invalidate(key);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error invalidating cache:', error);
    return NextResponse.json({ error: 'Failed to invalidate cache' }, { status: 500 });
  }
} 