import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  try {
    const parsed = new URL(imageUrl);
    const allowedHosts = ["image.tmdb.org", "images.unsplash.com"];
    if (!allowedHosts.includes(parsed.hostname)) {
      return new NextResponse("Domain not allowed", { status: 403 });
    }

    const res = await fetch(imageUrl);
    if (!res.ok) {
      return new NextResponse("Failed to fetch image", { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await res.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err: any) {
    return new NextResponse(`Error proxying image: ${err?.message || "unknown"}`, { status: 500 });
  }
}

