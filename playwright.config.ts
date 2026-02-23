import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// .env ファイルから環境変数を読み込む（ローカル開発時）
dotenv.config();

export default defineConfig({
    // テストファイルの検索ディレクトリ
    testDir: './tests/specs',

    // テストファイルのパターン
    testMatch: '**/*.spec.ts',

    // 各テストのタイムアウト（30秒）
    timeout: 30_000,

    // expect のタイムアウト（5秒）
    expect: {
        timeout: 5_000,
    },

    // テスト失敗時のリトライ回数（CI環境では2回、ローカルでは0回）
    retries: process.env.CI ? 2 : 0,

    // 並列実行ワーカー数（CI環境では1、ローカルでは自動）
    workers: process.env.CI ? 1 : undefined,

    // テストレポートの設定
    reporter: [
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['list'],
    ],

    // 全テスト共通の設定
    use: {
        // ステージング環境のベースURL（環境変数から取得）
        baseURL: process.env.BASE_URL ?? 'http://localhost:3000',

        // テスト失敗時にスクリーンショットを保存
        screenshot: 'only-on-failure',

        // テスト失敗時にトレースを保存
        trace: 'on-first-retry',

        // テスト失敗時に動画を保存
        video: 'retain-on-failure',

        // ブラウザのロケールを日本語に設定
        locale: 'ja-JP',

        // タイムゾーンを日本時間に設定
        timezoneId: 'Asia/Tokyo',
    },

    // テストプロジェクトの設定（ブラウザごと）
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        // 必要に応じて他ブラウザを追加
        // {
        //   name: 'firefox',
        //   use: { ...devices['Desktop Firefox'] },
        // },
        // {
        //   name: 'webkit',
        //   use: { ...devices['Desktop Safari'] },
        // },
    ],

    // テスト結果の出力ディレクトリ
    outputDir: 'test-results/',
});
