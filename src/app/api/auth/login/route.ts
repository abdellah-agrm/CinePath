import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations";
import {
  verifyPassword,
  signJWT,
  AUTH_COOKIE_NAME,
  DEMO_USERS,
  UserRole,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = loginSchema.safeParse(body);

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

    const { email, password } = validatedData.data;
    const normalizedEmail = email.toLowerCase().trim();

    let authenticatedUser: {
      id: string;
      fullName: string;
      email: string;
      role: UserRole;
    } | null = null;

    // 1. Try PostgreSQL if available
    try {
      const dbUser = await Promise.race([
        prisma.user.findUnique({
          where: { email: normalizedEmail },
        }),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error("DB Timeout")), 1500)
        ),
      ]);

      if (dbUser) {
        const isMatch = await verifyPassword(password, dbUser.passwordHash);
        if (isMatch) {
          authenticatedUser = {
            id: dbUser.id,
            fullName: dbUser.fullName,
            email: dbUser.email,
            role: dbUser.role as UserRole,
          };
        }
      }
    } catch (dbError) {
      console.warn("[Login API] Database unavailable, checking demo users...");
    }

    // 2. Fallback to Demo Users (for development/review)
    if (!authenticatedUser) {
      const demoUser = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === normalizedEmail
      );
      if (demoUser && password === demoUser.passwordPlain) {
        authenticatedUser = {
          id: demoUser.id,
          fullName: demoUser.fullName,
          email: demoUser.email,
          role: demoUser.role,
        };
      }
    }

    if (!authenticatedUser) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // 3. Generate signed JWT token
    const token = await signJWT({
      sub: authenticatedUser.id,
      email: authenticatedUser.email,
      fullName: authenticatedUser.fullName,
      role: authenticatedUser.role,
    });

    const response = NextResponse.json({
      success: true,
      message: "Authentication successful",
      user: authenticatedUser,
    });

    // 4. Set Secure HTTP-only Cookie
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
    console.error("[Login API] Error processing login:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Login failed" },
      { status: 500 }
    );
  }
}

