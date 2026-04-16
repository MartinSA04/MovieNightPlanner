import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { loadAvailableStreamingServices } from "@/server/settings";

const querySchema = z.object({
  countryCode: z.string().trim().length(2).transform((value) => value.toUpperCase())
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const parsed = querySchema.safeParse({
    countryCode: request.nextUrl.searchParams.get("countryCode") ?? ""
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a valid country code." }, { status: 400 });
  }

  try {
    const services = await loadAvailableStreamingServices(parsed.data.countryCode);
    return NextResponse.json({ services });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load streaming services.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
