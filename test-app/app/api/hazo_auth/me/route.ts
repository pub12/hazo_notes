/**
 * Mock authentication endpoint for testing
 * Returns a test user for demonstration purposes
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Return a mock authenticated user
  return NextResponse.json({
    authenticated: true,
    user_id: "test-user-123",
    id: "test-user-123",
    name: "Test User",
    user_name: "Test User",
    email: "test@example.com",
    user_email: "test@example.com",
    profile_image: null,
    profile_picture_url: null,
  });
}
