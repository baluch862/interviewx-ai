import { NextRequest, NextResponse } from 'next/server';
import { getSecurityHeaders } from '@/lib/backend-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const headers = getSecurityHeaders({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
  });

  const { searchParams } = new URL(req.url);
  const prompt = searchParams.get('prompt') || 'Hello Balu';

  // Create stream transformer
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      // 1. Send initial connection established message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event: 'connected', msg: 'Secure voice stream established.' })}\n\n`));
      await new Promise(r => setTimeout(r, 400));

      // Split prompt into words
      const words = prompt.split(/\s+/);
      let cumulativeDelay = 0;

      // 2. Stream word-by-word synced transcription and mock vocal wave data
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const duration = Math.max(180, word.length * 50 + (/[.,?!;]/.test(word) ? 150 : 0));
        
        const payload = {
          event: 'speech_chunk',
          word,
          index: i,
          startMs: cumulativeDelay,
          endMs: cumulativeDelay + duration,
          waveformMagnitude: Math.random() * 0.8 + 0.2 // dynamic amplitude simulation
        };

        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        cumulativeDelay += duration;

        // Yield execution to simulate voice real-time latency gaps
        await new Promise(r => setTimeout(r, duration * 0.8));
      }

      // 3. Send final transcription finished report
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event: 'completed', totalMs: cumulativeDelay })}\n\n`));
      controller.close();
    }
  });

  return new NextResponse(stream, { headers });
}
