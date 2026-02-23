# GitHub Copilot Instructions — Playwright 自動テストプロジェクト

## 1. プロジェクト概要

このリポジトリは、**Webシステム向けの自動テストコード**を管理するプロジェクトです。  
5名チームで協力してテストコードを開発・保守します。

| 項目               | 内容                            |
| ------------------ | ------------------------------- |
| テストフレームワーク | Playwright                      |
| 記述言語           | TypeScript                      |
| 設計パターン       | Page Object Model (POM)         |
| テスト種別         | リグレッションテスト / 結合テスト |
| テスト実行環境     | ステージング環境                  |
| CI/CD              | GitHub Actions                  |

---

## 2. リポジトリ構成

```
.
├── .github/
│   ├── copilot-instructions.md   # このファイル
│   └── workflows/
│       └── playwright.yml        # GitHub Actions CI定義
├── tests/
│   ├── specs/
│   │   ├── regression/           # リグレッションテスト (.spec.ts)
│   │   └── integration/          # 結合テスト（大分類ごとにサブフォルダ）
│   ├── pages/                    # Page Objectクラス群
│   ├── fixtures/                 # Playwrightフィクスチャ定義
│   ├── helpers/                  # 共通ユーティリティ・ヘルパー関数
│   └── data/                     # テストデータ (JSON等)
├── test-docs/
│   ├── regression/
│   │   └── regression-testcases.md   # リグレッションテスト仕様書（1ファイル固定）
│   └── integration/
│       └── sheet01-XXX.md        # 結合テスト仕様書（Excelシートごとに1ファイル）
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. 設計原則

### 3.1 Page Object Model (POM)

- **すべての画面操作はPageクラスに集約する**。テストコード内にロケータを直接書かない。
- `tests/pages/` 配下に画面ごとのクラスファイルを作成する（例: `LoginPage.ts`, `DashboardPage.ts`）。
- Pageクラスのメソッドは「ユーザー操作単位」で命名する（例: `login()`, `submitForm()`, `getErrorMessage()`）。
- Pageクラスのコンストラクタは `page: Page` のみを受け取る。

```typescript
// ✅ 良い例
export class LoginPage {
  constructor(private readonly page: Page) {}

  async login(email: string, password: string): Promise<void> {
    await this.page.getByLabel('メールアドレス').fill(email);
    await this.page.getByLabel('パスワード').fill(password);
    await this.page.getByRole('button', { name: 'ログイン' }).click();
  }

  async getErrorMessage(): Promise<string> {
    return this.page.getByRole('alert').textContent() ?? '';
  }
}

// ❌ 悪い例（テストコードに直接ロケータを書く）
await page.locator('#email').fill('user@example.com');
```

### 3.2 テストの独立性（Test Isolation）

- 各テストは**他のテストに依存しない**こと。テストの実行順序に関わらず結果が一定であること。
- `beforeEach`/`afterEach` でテスト前後の状態をリセットする。
- テストデータは `fixtures/` に外部化し、テストコードにハードコードしない。
- テスト間でログインセッションなどの状態を共有する場合は、Playwrightの `storageState` を使用する。

### 3.3 ロケータの優先順位

アクセシビリティに基づくロケータを優先し、壊れにくいテストを作る。

```
1. getByRole()       — 最優先（ARIAロール）
2. getByLabel()      — フォーム要素向け
3. getByText()       — 表示テキスト
4. getByTestId()     — data-testid属性（UIが変わっても安定）
5. locator('css')    — 最終手段のみ
```

### 3.4 アサーションの原則

- `expect` は必ず `await` する。
- アサーションは **1テストケースにつき1〜3個** を目安にする。
- エラーメッセージを明確にするために `{ message: '...' }` オプションを活用する。

```typescript
await expect(page.getByRole('heading', { name: 'ダッシュボード' }), {
  message: 'ログイン後にダッシュボードが表示されること',
}).toBeVisible();
```

### 3.5 環境変数の管理

- URLやアカウント情報などの環境依存値は **`.env`ファイルか`playwright.config.ts`のuse設定**で管理する。
- `.env` ファイルは `.gitignore` に追加し、リポジトリにコミットしない。
- `.env.example` にキー名のみ記載してリポジトリに含める。

---

## 4. コーディング規約

### 4.1 ファイル・クラス命名規則

| 種別              | 命名規則                         | 例                             |
| ----------------- | -------------------------------- | ------------------------------ |
| Pageクラス        | `PascalCase` + `Page` サフィックス | `tests/pages/LoginPage.ts`          |
| テストファイル    | `kebab-case.spec.ts`             | `tests/specs/regression/user-login.spec.ts` |
| ヘルパー関数      | `camelCase`                      | `tests/helpers/formatDate.ts`       |
| テストデータ      | `kebab-case.json`                | `tests/data/test-users.json`        |
| 仕様書 (リグレッション) | `regression-testcases.md`  | `test-docs/regression/regression-testcases.md` |
| 仕様書 (結合テスト) | `sheetNN-機能名.md`           | `test-docs/integration/sheet01-login.md` |

### 4.2 テストコードの構造

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage'; // tests/specs/regression/ からの相対パス

test.describe('ログイン機能', () => {
  // テストスイート単位のセットアップ
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('TC-001: 正常ログインができること', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);

    // Act
    await loginPage.login('user@example.com', 'Password1!');

    // Assert
    await expect(page).toHaveURL('/dashboard');
  });

  test('TC-002: 誤ったパスワードでエラーが表示されること', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login('user@example.com', 'wrong-password');
    await expect(loginPage.getErrorMessage()).resolves.toContain('パスワードが正しくありません');
  });
});
```

### 4.3 TypeScript厳格モード

- `strict: true` を `tsconfig.json` に設定すること。
- `any` 型の使用は禁止。使用が必要な場合はコメントで理由を明記する。
- 非同期処理は必ず `async/await` を使用し、`.then()` チェーンは使わない。

---

## 5. テスト仕様書フォーマット（.md）

### 5.1 リグレッションテスト仕様書

ファイル: `test-docs/regression/regression-testcases.md`（**1ファイル固定**）

```markdown
# リグレッションテスト仕様書

## テスト対象バージョン: vX.X.X
## 最終更新日: YYYY-MM-DD
## 担当者: 氏名

---

## テストスイート: [機能名]

| テストID | テストケース名 | 前提条件 | 操作手順 | 期待結果 | 優先度 |
|----------|---------------|---------|---------|---------|-------|
| RT-001   | 正常ログイン   | ユーザー登録済み | 1. /loginにアクセス<br>2. メール・パスワードを入力<br>3. ログインボタンをクリック | ダッシュボードにリダイレクト | 高 |
```

### 5.2 結合テスト仕様書

ファイル: `test-docs/integration/sheet[NN]-[機能名].md`（**Excelシートごとに1ファイル**）

```markdown
# 結合テスト仕様書：[機能名]

## テストシート名（Excelシート名に対応）
## テスト対象バージョン: vX.X.X
## 最終更新日: YYYY-MM-DD
## 担当者: 氏名

---

## テストスイート: [シナリオ名]

| テストID | テストケース名 | 前提条件 | 操作手順 | 期待結果 | 結合ポイント |
|----------|---------------|---------|---------|---------|------------|
| IT-001   | ...           | ...      | ...      | ...      | ...        |
```

### 5.3 仕様書からテストコードを生成する際のCopilotへの指示プロンプト例

```
以下のテスト仕様書を参照して、Playwrightのテストコードを生成してください。

【制約】
- TypeScriptで記述すること
- Page Object Modelを使用すること（Pageクラスが存在しない場合は同時に生成すること）
- テストIDをtest()の第1引数に含めること（例: 'TC-001: テストケース名'）
- ロケータはgetByRole/getByLabel/getByTestIdを優先すること
- テストデータは `tests/data/` に外部化すること

【仕様書】
（ここに.mdの内容を貼り付ける）
```

---

## 6. チーム開発のガイドライン

### 6.1 ブランチ戦略

```
main          ← 本番安定版（直接pushは禁止）
develop       ← 統合ブランチ
feature/      ← 新規テスト追加 (例: feature/login-test)
fix/          ← テスト修正 (例: fix/rt-001-selector-update)
chore/        ← 設定・ドキュメント変更 (例: chore/update-playwright)
```

- **`main` へのpushは禁止**。必ずPull Requestを通す。
- `develop` への直接pushも禁止。`feature/` か `fix/` ブランチを作成してPRを出す。
- PRには **レビュワーを最低1名** 設定する。

### 6.2 Pull Requestのルール

- PRタイトルは `[種別] 概要` の形式で記載する（例: `[feature] ログイン画面のリグレッションテスト追加`）。
- 対応するテスト仕様書のテストIDをPR本文に記載する（例: `対応仕様: RT-001, RT-002`）。
- CI（GitHub Actions）が**グリーン**でないとマージ不可。
- レビューでは以下の観点を確認する:
  - POMのルールに従っているか
  - 既存Pageクラスと重複がないか
  - テストが独立して実行できるか
  - 環境依存の値がハードコードされていないか

### 6.3 コンフリクト防止の運用ルール

- **1人1機能** を基本として、同一ファイルへの同時編集を避ける。
- 作業開始前に必ず `git pull origin develop` して最新化する。
- Page Objectの新規作成・変更は事前にチームに共有し、重複実装を防ぐ。

### 6.4 テストの分担と命名によるトレーサビリティ

- テストIDは仕様書と一致させ、変更しない（ID = 仕様書との紐付けキー）。
- テストファイルのJsDocコメントに担当者・作成日・対応仕様書を記載する。

```typescript
/**
 * @description ログイン機能 リグレッションテスト
 * @spec test-docs/regression/regression-testcases.md
 * @testIds RT-001, RT-002, RT-003
 * @author 担当者名
 * @created 2026-02-23
 */
```

---

## 7. GitHub Actions CI/CD

- `develop` および `main` ブランチへのPush・PRで自動実行。
- ステージング環境のURLはGitHub SecretsにStaging_Base_URLとして登録する。
- テスト結果はPlaywright HTMLレポートとしてArtifactにアップロードする。
- 失敗時はスクリーンショット・トレースも自動収集する。

---

## 8. Copilotへの追加指示

GitHub Copilotがコードを生成する際は、以下の方針に従うこと。

1. **新しい画面の操作コードは必ずPageクラスに実装する**。テストファイルにロケータを書かない。
2. **既存のPageクラスを再利用・拡張する**。同じロケータを複数ファイルに重複して書かない。
3. **テストケースにはテストIDを含める**（仕様書のIDと一致させる）。
4. **テストデータは `tests/data/` に外部化する**。Playwrightフィクスチャ定義は `tests/fixtures/` に置く。
5. **`waitForTimeout()` の使用は禁止**。`waitForSelector`, `toBeVisible`, `waitForResponse` 等を使う。
6. **環境URLやパスワードは `.env` から読み込む**。コードに直接書かない。
7. 生成コードには **日本語コメント** を付与する（チームメンバーが理解しやすいように）。
8. テスト追加時は、対応する**Pageクラスが存在しない場合に新規作成コードも合わせて出力する**。
