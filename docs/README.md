# docs/ — 公開用静的サイト

このディレクトリは GitHub Pages で配信される静的サイト一式。`main` ブランチ直下の `/docs` を公開対象として有効化する。

## ファイル構成

| パス | 用途 |
|---|---|
| `index.html` | LP 本体 |
| `legal/tokutei.html` | 特定商取引法に基づく表記 |
| `legal/privacy.html` | プライバシーポリシー |
| `legal/terms.html` | 業務委託規約 |
| `legal/_shared.css` | 法務ページ共通スタイル |
| `.nojekyll` | Jekyll 無効化マーカー（**削除しないこと**） |
| `inquiry-form-setup.md` | 問い合わせフォーム作成手順（リポジトリ内参照用） |

### `.nojekyll` が必要な理由

GitHub Pages のデフォルトは Jekyll でビルドされ、`_` で始まるファイル・ディレクトリが除外される。
本サイトは `_shared.css` を使っているため、Jekyll が有効だと法務ページのスタイルが 404 になる。
空ファイル `.nojekyll` を置くと Jekyll が無効化され、静的ファイルがそのまま配信される。

## 公開手順

1. リポジトリを GitHub に push
2. リポジトリの `Settings → Pages` を開く
3. `Build and deployment` で `Source: Deploy from a branch` を選択
4. `Branch: main`, `Folder: /docs` を指定し `Save`
5. 数十秒〜2分ほどで `https://<user>.github.io/<repo>/` で公開される
6. 以下の疎通確認を行う

## 公開後の疎通確認

- [ ] `https://<user>.github.io/<repo>/` で LP が表示される
- [ ] フォント（Noto Sans JP）が読み込まれる
- [ ] LP 内の「今のフォームの状況を送る」ボタンが動作する
  - INQUIRY_URL 設定後：新しいタブで Google フォームが開く
  - 未設定時：`mailto:contact@example.com` の下書きが開く（仮置きメール）
- [ ] フッターの3リンク（特商法 / プライバシー / 規約）が開ける
- [ ] 各法務ページのスタイル（`_shared.css`）が適用されている
- [ ] 各法務ページの「← トップへ戻る」で LP に戻れる
- [ ] 各法務ページ同士のフッターリンクが相互に動く

## 独自ドメインで公開したい場合

1. `docs/CNAME` ファイルを作成し、ドメイン名を1行で記入（例: `form-sort.example.jp`）
2. DNS で CNAME レコードを `<user>.github.io` に向ける
3. `Settings → Pages → Custom domain` にドメインを入力 → `Enforce HTTPS` を有効化

## 値の更新

LP・法務ページの屋号・連絡先などは `config/site-values.json` を編集したうえで以下を実行：

```bash
npm run site:preview  # 差分を確認（ドライラン）
npm run site:apply    # 書き込み
```

適用後は `git diff` で変更内容を確認し、コミット → push すれば GitHub Pages が自動更新される。
