import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bbox = searchParams.get("bbox"); // minLng,minLat,maxLng,maxLat
  const q = searchParams.get("q")?.trim();
  const tags = (searchParams.get("tags") || "").split(",").filter(Boolean);
  const district = searchParams.get("district") || undefined;
  const match = searchParams.get("match") === "all" ? "all" : "any";
  const limit = Number(searchParams.get("limit") || 200);
  const offset = Number(searchParams.get("offset") || 0);

  let query = supabase
    .from("locations")
    .select("title,slug,lat,lng,tags,district,summary", { count: "exact" });

  if (bbox) {
    const [minLng, minLat, maxLng, maxLat] = bbox.split(",").map(Number);
    query = query.gte("lat", minLat).lte("lat", maxLat).gte("lng", minLng).lte("lng", maxLng);
  }
  if (district) query = query.eq("district", district);
  if (tags.length) {
    if (match === "all") tags.forEach((t) => { query = query.contains("tags", [t]); });
    else query = query.overlaps("tags", tags);
  }
  if (q) query = query.ilike("title", `%${q}%`);

  const { data, count, error } = await query.range(offset, offset + limit - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, count });
}
