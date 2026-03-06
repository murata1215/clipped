/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * basePath: サブパス配信設定
   * Apache のリバースプロキシ経由で ribbon-re.jp/clipped/ でアクセスするため、
   * 全ルート・静的アセットに /clipped プレフィックスを付与する。
   */
  basePath: "/clipped",
};

export default nextConfig;
