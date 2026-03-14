import { getMplIdEndpointHealth } from "@/lib/api";

export const runtime = "edge";

export async function GET() {
  const health = await getMplIdEndpointHealth("/mplid/mvp-standings/");
  if (!health.ok) {
    return Response.json([], { status: 200, headers: { "x-upstream-status": String(health.status) } });
  }
  return Response.json([], { headers: { "cache-control": "public, s-maxage=300" } });
}
