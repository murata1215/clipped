/**
 * Prisma クライアント シングルトン
 *
 * Next.js の開発モードではホットリロードのたびにモジュールが再評価され、
 * PrismaClient のインスタンスが大量に生成されてコネクションプールを枯渇させる。
 * これを防ぐため、globalThis にインスタンスをキャッシュする。
 *
 * 参考: https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma クライアントインスタンス
 * 開発環境では globalThis にキャッシュ、本番環境では毎回新規作成
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
