import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user as userTable } from "../../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

interface UpdateProfileData {
  name?: string;
  phone?: string;
  company_name?: string;
  property_website?: string;
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const data: UpdateProfileData = await request.json();

    // Validate input
    if (data.name && data.name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name cannot be empty" },
        { status: 400 }
      );
    }

    if (data.property_website && data.property_website.trim().length > 0) {
      // Validate URL format
      try {
        new URL(data.property_website);
      } catch {
        return NextResponse.json(
          { error: "Invalid website URL" },
          { status: 400 }
        );
      }
    }

    // Build update object with correct schema field names (camelCase)
    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.phone !== undefined) updateData.phone = data.phone && data.phone.trim() ? data.phone.trim() : null;
    if (data.company_name !== undefined) updateData.companyName = data.company_name && data.company_name.trim() ? data.company_name.trim() : null;
    if (data.property_website !== undefined) updateData.propertyWebsite = data.property_website && data.property_website.trim() ? data.property_website.trim() : null;

    console.log('Updating user with data:', updateData);

    // Update user profile in Drizzle database
    const result = await db
      .update(userTable)
      .set(updateData)
      .where(eq(userTable.id, userId));

    console.log('Update result:', result);

    // Get updated user from database
    const dbUser = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, userId));

    if (!dbUser.length) {
      return NextResponse.json(
        { error: "User not found after update" },
        { status: 404 }
      );
    }

    console.log('Updated user:', dbUser[0]);

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: dbUser[0],
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get current user profile
    const user = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, userId));

    if (!user.length) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user[0]);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
