/**
 * pm2 プロセス管理設定ファイル
 * 本番環境で Next.js アプリを pm2 で起動するための設定
 */
module.exports = {
  apps: [{
    name: 'clipped',
    // node_modules/.bin/next はシェルスクリプトのため Node.js で直接実行不可
    // next.js の実際の JS エントリポイントを指定する
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/opt/clipped',
    env: {
      PORT: 3006,
      NODE_ENV: 'production'
    }
  }]
};
