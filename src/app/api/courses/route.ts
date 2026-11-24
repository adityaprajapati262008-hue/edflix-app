import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { CourseModel } from "@/models/Course";

export async function GET() {
  const db = await connectDB();
  if (!db) {
    return NextResponse.json({ courses: [], mode: "local" });
  }
  try {
    const courses = await CourseModel.find().sort({ createdAt: -1 }).limit(12).lean();
    return NextResponse.json({ courses, mode: "mongodb" });
  } catch {
    return NextResponse.json({ courses: [], mode: "local" });
  }
}

export async function PATCH(req: NextRequest) {
  const db = await connectDB();
  if (!db) {
    return NextResponse.json({ updated: false, mode: "local" });
  }
  try {
    const { id, modules } = await req.json();
    await CourseModel.findOneAndUpdate({ id }, { modules });
    return NextResponse.json({ updated: true, mode: "mongodb" });
  } catch {
    return NextResponse.json({ updated: false, mode: "local" });
  }
}
