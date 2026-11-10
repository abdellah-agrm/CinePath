import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const payload = await verifyJWT(token);

    if (!payload) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: payload.sub,
        email: payload.email,
        fullName: payload.fullName,
        role: payload.role,
      },
    });
  } catch (error: any) {
    console.error("[Me API] Error retrieving current user:", error);
    return NextResponse.json(
      { authenticated: false, user: null, error: "Authentication check failed" },
      { status: 500 }
    );
  }
}

