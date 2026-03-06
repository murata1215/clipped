"use client";

import React from "react";

// ============================================================
// 型定義
// ============================================================

/**
 * ErrorBoundary コンポーネントのプロパティ
 */
type ErrorBoundaryProps = {
  /** 子コンポーネント */
  children: React.ReactNode;
};

/**
 * ErrorBoundary コンポーネントの内部ステート
 */
type ErrorBoundaryState = {
  /** エラーが発生したかどうか */
  hasError: boolean;
  /** 発生したエラーオブジェクト（デバッグ用） */
  error: Error | null;
};

// ============================================================
// コンポーネント
// ============================================================

/**
 * グローバルエラーバウンダリ
 *
 * React のレンダリング中に発生した未捕捉エラーをキャッチし、
 * アプリ全体が真っ白になる（"Application error" 画面）のを防ぐ。
 *
 * エラー発生時は:
 * 1. エラーメッセージをコンソールに出力
 * 2. 「エラーが発生しました」画面を表示
 * 3. 「ページを再読み込み」ボタンでリカバリ可能
 *
 * React の Error Boundary はクラスコンポーネントでのみ実装可能
 * （2024年時点で関数コンポーネントでは getDerivedStateFromError が使えない）
 */
export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * エラー発生時にステートを更新する（静的メソッド）
   * React のレンダリングフェーズで呼ばれる
   *
   * @param error - 発生したエラーオブジェクト
   * @returns 更新後のステート
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * エラー発生後のコミットフェーズで呼ばれる
   * エラーログをコンソールに出力する
   *
   * @param error - 発生したエラーオブジェクト
   * @param errorInfo - React のコンポーネントスタック情報
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("ErrorBoundary がエラーをキャッチしました:", error);
    console.error("コンポーネントスタック:", errorInfo.componentStack);
  }

  /**
   * ページ再読み込みハンドラ
   * ブラウザのリロードでアプリを完全にリセットする
   */
  handleReload = (): void => {
    window.location.reload();
  };

  /**
   * エラー状態をリセットして再試行するハンドラ
   * リロードせずにコンポーネントツリーの再レンダリングを試みる
   */
  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            {/* エラーアイコン */}
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full
                            flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            {/* エラーメッセージ */}
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              予期しないエラーが発生しました
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              アプリケーションで問題が発生しました。
              ページを再読み込みするか、もう一度お試しください。
            </p>

            {/* デバッグ用エラー詳細（開発者向け） */}
            {this.state.error && (
              <p className="text-xs text-gray-400 mb-4 font-mono bg-gray-50 p-2 rounded break-all">
                {this.state.error.message}
              </p>
            )}

            {/* アクションボタン */}
            <div className="flex gap-3 justify-center">
              <button
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg
                           hover:bg-gray-300 transition-colors"
                onClick={this.handleRetry}
              >
                再試行
              </button>
              <button
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg
                           hover:bg-blue-600 transition-colors"
                onClick={this.handleReload}
              >
                ページを再読み込み
              </button>
            </div>
          </div>
        </div>
      );
    }

    // エラーがない場合は子コンポーネントをそのまま描画
    return this.props.children;
  }
}
