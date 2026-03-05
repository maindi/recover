import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getStripeConnectUrl } from "@/server/services/stripe-connect";

export async function GET() {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = getStripeConnectUrl();
  return NextResponse.redirect(url);
}
