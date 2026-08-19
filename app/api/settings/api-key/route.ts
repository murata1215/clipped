/**
 * API Key 取得エンドポイント
 *
 * ログインユーザーのみが CLIPPED_API_KEY を取得できる。
 * PixDraft 等の外部連携設定時に UI からコピーするために使用。
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.CLIPPED_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  return NextResponse.json({ apiKey });
}
