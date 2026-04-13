# フォーム仕分け自動化パック

Googleフォームの回答を、カテゴリ別のスプレッドシートへ自動で振り分ける Google Apps Script ツール。
このリポジトリは、それを **販売可能な受託パッケージ** として運営・営業・法務まで一通り揃えたものです。

## ディレクトリ構成

| ディレクトリ | 役割 |
|---|---|
| `Code.gs` | 本体のGoogle Apps Scriptコード |
| `lib/` | 純関数として抽出したロジック（Node.jsでテスト可能な形） |
| `tests/` | `lib/` に対するユニットテスト |
| `config/` | サイト共通の値（屋号・連絡先など）を一元管理 |
| `scripts/` | メンテ用スクリプト（プレースホルダ一括適用など） |
| `sales/` | LP原稿・価格表・営業文面・FAQ・NG表現など販売資料一式 |
| `docs/` | 公開用LP（HTML・1ファイル）と法務HTMLページ、問い合わせフォーム作成手順 |
| `docs/legal/` | 特商法表記・プライバシーポリシー・業務委託規約のHTML版 |
| `deliverables/` | 納品時にお客様へお渡しする運用マニュアル・サンプルデータ・動作確認チェックリスト |
| `legal/` | 法務文書のMarkdown原稿（HTML生成元） |
| `templates/` | 見積書・請求書・領収書のひな形 |
| `ops/` | 返信メールテンプレ・案件管理シート設計・月次行動計画・営業先ガイド |
| `x-social/` | Xのプロフィール・固定投稿・発信テーマ30案 |
| `.github/workflows/` | GitHub Actions（CI） |

## 商品仕様

- フォーム送信時に自動でカテゴリ別シートへ振り分け
- 振り分けルールは `_rules` シート上で編集可能（コード編集不要）
- 12種のoperator（equals / contains / regex / gte / lte など）
- 表記揺れ吸収（`_normalize` シートで「資料要求 → 資料請求」のような正規化マップ）
- 重複検知（指定列の組み合わせで同一申込を除外）
- ドライラン（ルール変更時、書き込まず結果だけを確認）
- ダッシュボード自動生成（カテゴリ別・ルール別・日付別の件数）
- ルール単位の通知メール送信
- Slack / Chatwork 連携（カスタムプラン）
- 処理ログシートで履歴を記録
- カスタムメニューから主要操作を実行可能
- 月額費用なし（Google Apps Scriptの無料枠内で動作）

### 品質担保

- ルール判定ロジックはNode.jsでユニットテスト済み（`tests/rule-engine.test.js`）
- GitHub Actions で push/PR ごとにテストが自動実行される

## プラン

| プラン | 価格 | 主な機能 |
|---|---|---|
| ライト | 14,800円 | フォーム1件 / カテゴリ3つ / 基本仕分け |
| スタンダード | 29,800円 | フォーム2件 / カテゴリ10個 / 複数条件 / メール通知 |
| カスタム | 49,800円〜 | 無制限 / 複雑条件 / Slack or Chatwork 連携 |

全プラン共通：動作しなかった場合 **全額返金**。

## 販売開始までのチェックリスト

### 事前準備
- [ ] 屋号を決める
- [ ] 連絡用メールアドレスを作成
- [ ] 振込先口座を決める
- [ ] バーチャルオフィスを契約（特商法対応）または「請求時開示」で運用
- [ ] `config/site-values.json` の `business_name` / `owner_name` / `contact_email` を実値に差し替え
- [ ] `npm run site:apply` で LP・法務ページ・テンプレの仮置き値を一括更新

### LP公開
- [ ] GitHubリポジトリに push
- [ ] Settings → Pages → `main` / `/docs` に設定
- [ ] `https://<user>.github.io/gas-form-aggregator/` で公開確認
- [ ] 法務HTMLリンクが全ページ footer に機能していることを確認
- [ ] `_shared.css` が適用されている（= `.nojekyll` が効いている）ことを確認

### 問い合わせ導線
- [ ] `docs/inquiry-form-setup.md` 手順でGoogleフォームを作成
- [ ] `docs/index.html` 末尾の `INQUIRY_URL` にフォームURLを設定
- [ ] `ops/form-confirmation-message.md` の本文をフォーム確認画面に貼付
- [ ] 自分宛てにテスト送信 → 通知メール受信 → 回答シート反映を確認

### デモ準備
- [ ] `deliverables/sample-data.md` でデモ用スプレッドシートを作成
- [ ] Before/After スクリーンショット撮影
- [ ] 30秒デモ動画撮影（LP埋め込み or YouTube限定公開）

### 営業準備
- [ ] X アカウント整備（`x-social/profile.md`）
- [ ] 固定投稿設定（`x-social/pinned-post.md`）
- [ ] 初期3投稿を発信（`x-social/content-themes.md` A群）
- [ ] 営業リスト100件作成（`ops/outreach-list-guide.md`）

### 案件管理
- [ ] `ops/project-sheet.md` の設計で案件管理シートを作成
- [ ] `templates/quotation.md` で見積書をGoogleドキュメント化
- [ ] `templates/invoice.md` で請求書をGoogleドキュメント化

### 行動開始
- [ ] `ops/monthly-plan.md` の Day別アクションに従って実行
- [ ] 週1で振り返り、数字（DM送信数・返信率・見積提示率）をレビュー

## 開発（テストの実行）

```bash
npm test              # ルール判定ロジックのユニットテスト
npm run site:preview  # LP/法務ページの値置換をドライラン
npm run site:apply    # 値置換を書き込み（lock ファイル更新込み）
npm run check:links   # docs/ 配下の HTML 内部リンク切れ検査
npm run serve         # docs/ をローカル配信（既定 http://localhost:4173）
npm run og:build      # og-image.svg から PNG を再生成（Chrome headless 使用・ローカル専用）
```

Node.js 22以上が必要（GitHub Actions の CI でも 22 を使用）。
追加依存パッケージはありません（Node 標準ライブラリのみ使用）。

CI（`.github/workflows/test.yml`）は3ジョブ構成：
- `test` — `npm test`
- `site-values-sync` — `site:apply` 実行後に未コミット差分がないことを検証
- `link-check` — `check:links`

## サイト値の更新フロー

LP・法務ページ・メールテンプレ等で参照される屋号・連絡先・制定日などは `config/site-values.json` で一元管理している。

1. `config/site-values.json` を編集
2. `npm run site:preview` で差分を確認
3. `npm run site:apply` で全ファイルに書き込み
4. `git diff` で変更を確認しコミット

### 冪等性

初回は `{屋号}` 等のプレースホルダを実値に置換し、自動で `config/.site-values.lock.json` を生成する。
2回目以降は lock ファイルの「前回適用値」から最新値へ差分置換するため、
`site-values.json` を編集して再実行するだけで LP・法務ページ・テンプレ類が追従する。
lock ファイルもコミット対象に含めること（手動編集は不要）。

## Code.gs と lib/ の同期ルール

`Code.gs` の `evaluateRule` / `routeRow` / `normalizeRow` / `makeDedupeKey` は
`lib/rule-engine.js` と同一ロジックを持ちます。
ロジックを変更する場合は **必ず両方を更新してください**。

- GAS は Node.js エコシステムと分離されているため、テスト対象は `lib/` 側で持つ
- `Code.gs` は単一ファイルで納品・貼り付け運用しているので、import/export はしない
- どちらか一方のみを編集すると、納品コードにテスト未検証の差分が入る

## セットアップ（納品時の標準手順）

お客様のスプレッドシートで：

1. 拡張機能 → Apps Script
2. `Code.gs` の内容を貼り付けて保存
3. スプレッドシートを再読み込み → メニュー「フォーム仕分け」表示
4. `フォーム仕分け → 設定シートを初期化`
5. `_config` / `_rules` を編集
6. `フォーム仕分け → テスト実行（最新1件）` で動作確認
7. `フォーム仕分け → 自動トリガーを設定`

詳細は `deliverables/setup-guide.md`。

## 運用ドキュメントの読む順序

初めてこのリポジトリを触る場合：

1. `sales/positioning.md` — 何を売っているか
2. `sales/LP.md` — 商品の世界観
3. `ops/monthly-plan.md` — 初月に何をやるか
4. `ops/email-templates.md` — 問い合わせが来たらどう返すか
5. `ops/project-sheet.md` — どう案件を管理するか

## 匿名運営での信用担保

- 作業手順の全工程を LP に公開（ブラックボックス感の排除）
- 編集権限は作業中のみ付与・納品後に返却
- 全額返金保証（納品後7日以内に動作確認できない場合）
- 特商法・プライバシーポリシー・業務委託規約をLPから常時アクセス可能に
- `deliverables/privacy-and-permissions.md` を納品時に必ず同梱

詳細は `sales/trust-boosters.md`。
