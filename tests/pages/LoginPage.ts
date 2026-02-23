import { type Page, type Locator } from '@playwright/test';

/**
 * ログイン画面の Page Object クラス
 * @description ログイン画面に関するすべての操作をカプセル化する
 */
export class LoginPage {
    // ロケータの定義（すべて getByRole / getByLabel を優先）
    private readonly emailInput: Locator;
    private readonly passwordInput: Locator;
    private readonly loginButton: Locator;
    private readonly errorAlert: Locator;

    constructor(private readonly page: Page) {
        this.emailInput = page.getByLabel('メールアドレス');
        this.passwordInput = page.getByLabel('パスワード');
        this.loginButton = page.getByRole('button', { name: 'ログイン' });
        this.errorAlert = page.getByRole('alert');
    }

    /**
     * ログインページに遷移する
     */
    async goto(): Promise<void> {
        await this.page.goto('/login');
    }

    /**
     * メールアドレスとパスワードを入力してログインボタンをクリックする
     * @param email - ログインするメールアドレス
     * @param password - ログインするパスワード
     */
    async login(email: string, password: string): Promise<void> {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }

    /**
     * ログインフォームのバリデーションエラーメッセージを取得する
     * @returns エラーメッセージのテキスト
     */
    async getErrorMessage(): Promise<string> {
        return (await this.errorAlert.textContent()) ?? '';
    }

    /**
     * エラーアラートが表示されているかどうかを確認する
     */
    async isErrorVisible(): Promise<boolean> {
        return this.errorAlert.isVisible();
    }
}
