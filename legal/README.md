# 法務関連文書

販売開始前に必ず整える。特に匿名運営の場合、これらが揃っていないと信用が毀損する／行政指導の対象となる。

| ファイル | 用途 | LPへの反映 |
|---|---|---|
| `tokutei.md` | 特定商取引法に基づく表記 | footer にリンク必須 |
| `privacy.md` | プライバシーポリシー | footer にリンク必須 |
| `terms.md` | 業務委託規約 | 見積送付時に併せて提示 |

## チェックリスト（公開前）

- [x] `docs/legal/tokutei.html` / `privacy.html` / `terms.html` を HTML化（配置済み）
- [x] LP footer にリンク設置（`docs/index.html`）
- [ ] `config/site-values.json` の `business_name` / `owner_name` / `contact_email` を実値に差し替え → `npm run site:apply`
- [ ] 住所・電話は「バーチャルオフィス契約」または「請求時開示」の運用を決定（現状は「請求時開示」で記載）
- [ ] 問い合わせフォーム冒頭に「送信により特商法表記・プライバシーポリシーに同意したものとみなします」を追加

## 値の更新方法

屋号・氏名・連絡先・制定日などは `config/site-values.json` で一元管理。
値を変更した後 `npm run site:apply` を実行すると、本ディレクトリの Markdown と `docs/legal/*.html` の両方に同じ値が反映される（冪等）。

## HTML化の参考

Markdown 原稿と HTML はどちらも `config/site-values.json` の値で同期する。
スタイルは `docs/legal/_shared.css` で共通化し、LP（`docs/index.html`）とトーンを揃えている。
