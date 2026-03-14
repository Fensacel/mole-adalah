import { getMplIdHeroPools } from "@/lib/api";

export const runtime = "edge";

export async function GET() {
  const data = await getMplIdHeroPools();
  return Response.json(data, { headers: { "cache-control": "public, s-maxage=300" } });
}
