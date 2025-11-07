import { NextRequest, NextResponse } from 'next/server';
import { getFigmaAccessToken } from '@/lib/figma-token';

interface FigmaFrame {
  id: string;
  name: string;
  type: string;
  imageUrl: string | null;
  width?: number;
  height?: number;
  isVertical?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { figmaUrl } = body;

    if (!figmaUrl) {
      return NextResponse.json(
        { error: 'Figma URL is required' },
        { status: 400 }
      );
    }

    // Extract file ID from Figma URL (support both old and new formats)
    const fileIdMatch = figmaUrl.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
    if (!fileIdMatch) {
      return NextResponse.json(
        { error: 'Invalid Figma URL format. Please provide a valid Figma file URL.' },
        { status: 400 }
      );
    }

    const figmaFileId = fileIdMatch[1];
    console.log(`[FIGMA_PREVIEW] Loading preview for Figma file: ${figmaFileId}`);
    
    const figmaAccessToken = await getFigmaAccessToken();

    if (!figmaAccessToken) {
      console.error(`[FIGMA_PREVIEW] ❌ No Figma token available`);
      return NextResponse.json(
        { error: 'Figma access token not configured. Please add FIGMA_ACCESS_TOKEN to your environment variables or update it in Settings.' },
        { status: 500 }
      );
    }

    const maskedToken = figmaAccessToken.substring(0, 10) + '...' + figmaAccessToken.substring(figmaAccessToken.length - 4);
    console.log(`[FIGMA_PREVIEW] ✅ Using token from getFigmaAccessToken(): ${maskedToken}`);
    console.log(`[FIGMA_PREVIEW] Token length: ${figmaAccessToken.length} characters`);

    // Extract node ID from URL if specified
    const nodeIdMatch = figmaUrl.match(/node-id=([^&]+)/);
    let targetNodeId = nodeIdMatch ? nodeIdMatch[1].replace(/-/g, ':') : null;

    const frames: FigmaFrame[] = [];

    if (targetNodeId) {
      // If specific node ID is provided, fetch that node directly
      console.log(`Fetching specific node: ${targetNodeId}`);
      
      try {
        const nodeResponse = await fetch(`https://api.figma.com/v1/files/${figmaFileId}/nodes?ids=${targetNodeId}`, {
          headers: {
            'X-Figma-Token': figmaAccessToken,
          },
        });

        if (!nodeResponse.ok) {
          const errorText = await nodeResponse.text();
          const maskedToken = figmaAccessToken.substring(0, 10) + '...' + figmaAccessToken.substring(figmaAccessToken.length - 4);
          console.error(`[FIGMA_PREVIEW] ❌ Figma API error for node:`);
          console.error(`[FIGMA_PREVIEW]   - Status: ${nodeResponse.status}`);
          console.error(`[FIGMA_PREVIEW]   - Error: ${errorText}`);
          console.error(`[FIGMA_PREVIEW]   - Token used: ${maskedToken}`);
          return NextResponse.json(
            { error: `Failed to fetch specific node: ${nodeResponse.status} ${nodeResponse.statusText}` },
            { status: 400 }
          );
        }

        const nodeData = await nodeResponse.json();
        const targetNode = nodeData.nodes[targetNodeId];
        
        if (!targetNode) {
          return NextResponse.json(
            { error: `Node with ID ${targetNodeId} not found` },
            { status: 404 }
          );
        }

        console.log(`Found target node: ${targetNode.document.name}`);

        // Process frames within the target node
        const nodesToProcess = [];
        
        // If the target node itself is a frame, process it
        if (targetNode.document.type === 'FRAME' || targetNode.document.type === 'COMPONENT') {
          nodesToProcess.push(targetNode.document);
        }
        
        // Also process any child frames
        if (targetNode.document.children) {
          for (const child of targetNode.document.children) {
            if (child.type === 'FRAME' || child.type === 'COMPONENT') {
              nodesToProcess.push(child);
            }
          }
        }

        // Get images for all frames
        const frameIds = nodesToProcess.map(node => node.id);
        let imageUrls: Record<string, string> = {};
        
        if (frameIds.length > 0) {
          try {
            const imageResponse = await fetch(`https://api.figma.com/v1/images/${figmaFileId}?ids=${frameIds.join(',')}&format=png&scale=0.5`, {
              headers: {
                'X-Figma-Token': figmaAccessToken,
              },
            });

            if (imageResponse.ok) {
              const imageData = await imageResponse.json();
              imageUrls = imageData.images || {};
              console.log(`Loaded ${Object.keys(imageUrls).length} images for preview`);
            }
          } catch (error) {
            console.error('Error fetching images:', error);
          }
        }

        // Build frames array
        nodesToProcess.forEach(node => {
          // Determine slide orientation based on dimensions
          const width = (node as any).absoluteBoundingBox?.width || 0;
          const height = (node as any).absoluteBoundingBox?.height || 0;
          const isVertical = height > width;
          
          frames.push({
            id: node.id,
            name: node.name || 'Untitled Frame',
            type: node.type,
            imageUrl: imageUrls[node.id] || null,
            width: width,
            height: height,
            isVertical: isVertical
          });
        });

      } catch (error) {
        console.error('Error fetching specific node:', error);
        return NextResponse.json(
          { error: 'Failed to fetch the specified node from Figma' },
          { status: 500 }
        );
      }
    } else {
      // Process all pages and frames (original logic)
      const fileResponse = await fetch(`https://api.figma.com/v1/files/${figmaFileId}`, {
        headers: {
          'X-Figma-Token': figmaAccessToken,
        },
      });

      if (!fileResponse.ok) {
        const errorText = await fileResponse.text();
        console.error('Figma API error:', errorText);
        return NextResponse.json(
          { error: `Failed to fetch Figma file: ${fileResponse.status} ${fileResponse.statusText}` },
          { status: 400 }
        );
      }

      const fileData = await fileResponse.json();
      const allFrames = [];

      // Collect all frames
      for (const page of fileData.document.children) {
        for (const node of page.children) {
          if (node.type === 'FRAME' || node.type === 'COMPONENT') {
            allFrames.push(node);
          }
        }
      }

      // Get images for all frames (limit to first 50 to avoid API limits)
      const limitedFrames = allFrames.slice(0, 50);
      const frameIds = limitedFrames.map(node => node.id);
      let imageUrls: Record<string, string> = {};
      
      if (frameIds.length > 0) {
        try {
          const imageResponse = await fetch(`https://api.figma.com/v1/images/${figmaFileId}?ids=${frameIds.join(',')}&format=png&scale=0.5`, {
            headers: {
              'X-Figma-Token': figmaAccessToken,
            },
          });

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            imageUrls = imageData.images || {};
            console.log(`Loaded ${Object.keys(imageUrls).length} images for preview`);
          }
        } catch (error) {
          console.error('Error fetching images:', error);
        }
      }

      // Build frames array
      limitedFrames.forEach(node => {
        // Determine slide orientation based on dimensions
        const width = (node as any).absoluteBoundingBox?.width || 0;
        const height = (node as any).absoluteBoundingBox?.height || 0;
        const isVertical = height > width;
        
        frames.push({
          id: node.id,
          name: node.name || 'Untitled Frame',
          type: node.type,
          imageUrl: imageUrls[node.id] || null,
          width: width,
          height: height,
          isVertical: isVertical
        });
      });
    }

    console.log(`Preview loaded. Found ${frames.length} frames`);

    return NextResponse.json({
      success: true,
      frames: frames,
      totalFrames: frames.length
    });

  } catch (error) {
    console.error('Error loading preview:', error);
    return NextResponse.json(
      { error: 'Failed to load preview. Please check the server logs for details.' },
      { status: 500 }
    );
  }
} 