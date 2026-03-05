import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { handleStripeOAuthCallback } from "@/server/services/stripe-connect";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=missing_code", req.url)
    );
  }

  try {
    await handleStripeOAuthCallback(code);
    return NextResponse.redirect(
      new URL("/dashboard/settings?connected=true", req.url)
    );
  } catch {
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=connection_failed", req.url)
    );
  }
}
