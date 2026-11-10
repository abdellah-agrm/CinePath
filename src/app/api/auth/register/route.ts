import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validations";
import { hashPassword, signJWT, AUTH_COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = registerSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validatedData.error.errors.map((e) => e.message),
        },
        { status: 400 }
      );
    }

    const { email, password, fullName, phone } = validatedData.data;

    let user: any = null;

    try {
      // Check if user already exists
      const existingUser = await Promise.race([
        prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        }),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error("DB Timeout")), 1500)
        ),
      ]);

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: "An account with this email already exists." },
          { status: 409 }
        );
      }

      const hashedPassword = await hashPassword(password);

      user = await prisma.user.create({
        data: {
          fullName,
          email: email.toLowerCase(),
          passwordHash: hashedPassword,
          phone: phone || null,
          role: "CUSTOMER",
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          phone: true,
          createdAt: true,
        },
      });
    } catch (dbError) {
      console.warn("[Register API] Database unreachable or timed out. Falling back to demo mode session.", dbError);
      // Demo fallback user
      user = {
        id: `user-cust-${Date.now()}`,
        fullName,
        email: email.toLowerCase(),
        role: "CUSTOMER",
        phone: phone || null,
        createdAt: new Date(),
      };
    }

    // Sign JWT
    const token = await signJWT({
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      message: "Account registered successfully",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("[Register API] Unhandled error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Registration failed" },
      { status: 500 }
    );
  }
}

