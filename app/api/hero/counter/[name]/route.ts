import { getHeroCounter } from '@/lib/api';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const data = await getHeroCounter(decodeURIComponent(name));
  return Response.json(data);
}
