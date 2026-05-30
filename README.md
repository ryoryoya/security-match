# security-match

警備会社間で余剰人員と不足人数を共有するクローズド招待制マッチングアプリ（MVP）。

- **フロント**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **バックエンド**: Supabase (Postgres + Auth + Realtime) / RLSで会社単位アクセス制御
- **認証**: Supabase Auth（メール＋パスワード、招待制サインアップ）

## 機能（MVP）

| ページ | 説明 |
|---|---|
| `/login` | ログイン |
| `/signup` | ネットワーク最初の1社をブートストラップ |
| `/invite/[token]` | 招待リンクからのサインアップ |
| `/` | ダッシュボード（統計 + 最新案件） |
| `/jobs` | 案件一覧 (都道府県・ステータス絞り込み) |
| `/jobs/new` | 案件投稿 (日時・場所・必要人数・単価) |
| `/jobs/[id]` | 案件詳細 / 応募 / 応募承認 |
| `/my-jobs` | 自社投稿案件管理 |
| `/messages` | メッセージスレッド一覧 |
| `/messages/[threadId]` | 会社間チャット（Realtime） |
| `/settings` | 通知メール設定 + 会社情報編集 + 招待リンク発行 |

## 通知メール

`jobs` / `applications` への INSERT で Supabase Edge Function `send-notification` がDBトリガー(`pg_net`)経由で起動し、Resend API でメールを送信。

- 案件投稿時 → ネットワーク内の他社全員に通知
- 応募時 → 案件オーナー会社に通知

設定が必要な Supabase Edge Function シークレット:

| Name | 用途 |
|---|---|
| `RESEND_API_KEY` | Resend API キー |
| `WEBHOOK_SECRET` | DBトリガーからのリクエスト検証用 (security migrationで自動生成、`public._secrets` に保管) |
| `FROM_EMAIL` (任意) | デフォルト `security-match <onboarding@resend.dev>` |
| `APP_URL` (任意) | メール内のアプリURL。デフォルトlocalhost |

## セキュリティ設計

- 全テーブル RLS 有効、`current_company_id()` ヘルパで会社単位分離
- `profiles` の `company_id` / `role` は authenticated 役割から column-level GRANT で UPDATE 不可
- `applications.status` の更新は `update_application_status` RPC (案件オーナーのみ) 経由
- `applications` UPDATE は応募者のみ可、列は `offered_count, note` のみ
- 案件への応募は `status='open'` の他社案件のみ受付
- DBトリガー → Edge Function は `X-Webhook-Secret` ヘッダーで検証 (timing-safe)
- 招待トークンは 144bit ランダム / 14日期限 / 一度きり消費
- メッセージ: `sender_user_id = auth.uid()` でなりすまし防止
- `_secrets` テーブルは RLS 有効・ポリシーなし (一般ユーザーから完全遮断)

## セットアップ

### 1. 依存パッケージのインストール

```bash
cd "C:\Users\jinye\OneDrive\デスクトップ\security-match"
npm install
```

### 2. 環境変数

`.env.local` は既に設定済みです（Supabaseプロジェクト `security-match` に接続）:

```
NEXT_PUBLIC_SUPABASE_URL=https://hvgdqbvzxvspbvluvilh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_LBEqdSFDIB6337BRXGGxKw_X3vNRChH
```

### 3. Supabase側の設定（必須）

**Auth → Providers → Email** で以下を確認してください:

- **Email provider**: Enabled
- **Confirm email**: **OFF** に設定（MVP開発中はメール確認スキップ推奨）
  - ダッシュボード: https://supabase.com/dashboard/project/hvgdqbvzxvspbvluvilh/auth/providers
  - "Confirm email" トグルをOFFに

これをOFFにしないと `signUp()` 後にセッションが作られず、直後のRPC呼び出しで失敗します。

### 4. 開発サーバー起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

## 動作確認シナリオ（End-to-End）

### シナリオA: 最初の会社をブートストラップ

1. http://localhost:3000/signup を開く
2. アカウント情報＋会社情報を入力 → 「登録する」
3. ダッシュボードにリダイレクトされる

### シナリオB: 2社目を招待で参加させる

1. シナリオAのユーザーで `/settings` を開く
2. 「招待リンク発行」ボタンを押す → URLコピー
3. **別のブラウザ（またはシークレットウィンドウ）**で招待URLを開く
4. 2社目のアカウント＋会社情報を入力 → 「ネットワークに参加」
5. ダッシュボードが表示される

### シナリオC: 案件マッチング

1. 会社A: `/jobs/new` で案件投稿
2. 会社B: `/jobs` で案件を確認 → 詳細ページで「応募する」
3. 会社A: `/my-jobs` → 該当案件 → 応募一覧で「承認」
4. 会社A: 「チャットで連絡」でスレッド作成 → メッセージ送信
5. 会社B: `/messages` にスレッドが現れ、Realtimeでメッセージ受信

### シナリオD: RLS検証

1. 3社目を別ブラウザで招待参加させる
2. 会社A/Bのチャットスレッドは 3社目には見えない
3. 3社目の応募は会社A/Bから見られる（案件オーナー/応募者のみ）

## データモデル

```
companies ── 1:N ── profiles (auth.users)
     │
     └── 1:N ── jobs ─── 1:N ── applications ── N:1 ── companies
                    │
                    └── 1:N ── message_threads ── 1:N ── messages
```

- **RLS**: 全テーブル有効
- **current_company_id()**: SECURITY DEFINER関数で自社IDを取得、ポリシー内で使用
- **RPC**: `bootstrap_first_company`, `accept_invitation`, `create_invitation`, `lookup_invitation`

マイグレーションはSupabase MCPで直接適用済み。追加変更は `supabase db diff` などでSQLを書き下ろしてください。

## トラブルシューティング

| 症状 | 対処 |
|---|---|
| サインアップで "email not confirmed" | Supabaseダッシュボードで Confirm email をOFFに |
| 招待リンクで "invitation not found" | トークンが正しいか、Supabase `invitations` テーブルを確認 |
| 案件投稿で "new row violates RLS" | ログイン中のユーザーが profile を持っているか確認 |
| チャットがリアルタイム更新されない | `alter publication supabase_realtime add table public.messages` が適用済みか確認（migration投入済み） |

## 今後の拡張（後続フェーズ）

- 資格・スキル管理（交通誘導2級など）
- 契約書生成・電子署名
- 請求・支払い機能
- プッシュ通知 / メール通知
- モバイルネイティブアプリ
- 地図連携
