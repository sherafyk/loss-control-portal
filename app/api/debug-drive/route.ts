import { NextResponse } from "next/server";
import { getDriveFolderInfo } from "@/lib/drive";

export async function GET() {
  try {
    const info = await getDriveFolderInfo();
    return NextResponse.json({ ok: true, info });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}