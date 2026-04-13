# docs/assets/ — LP 用静的アセット

LP（`docs/index.html`）から参照される画像・アイコン類。

| ファイル | 用途 | 状態 |
|---|---|---|
| `favicon.svg` | 各種ブラウザタブ用アイコン（ベクタ） | 配置済み |
| `favicon.ico` | レガシーブラウザ用 fallback | **未配置（任意）** |
| `og-image.png` | OGP / Twitter カード画像（1200×630 推奨） | **未配置（撮影後に配置）** |
| `demo-before.png` | デモ Before スクリーンショット | **未配置** |
| `demo-after-tabs.png` | デモ After（タブ一覧） | **未配置** |
| `demo-after-filtered.png` | デモ After（絞り込み後シート） | **未配置** |
| `demo-rules-sheet.png` | `_rules` シートの中身 | **未配置** |
| `demo.mp4` | 30秒デモ動画（任意・YouTube 限定公開で代替可） | **未配置** |

## 撮影手順

`sales/demo-shotlist.md` を参照。

## og-image.png の作り方（簡易）

1. 1200×630 のキャンバスを用意（Figma / Canva / Keynote など）
2. 背景は白、左側に `favicon.svg` の拡大版（青色アイコン）
3. 中央～右に大きく「フォーム仕分け自動化パック」のタイトル
4. 下部に「Googleフォーム回答を、カテゴリ別シートに自動振り分け」等のサブコピー
5. PNG で書き出して `og-image.png` として保存

## 容量の目安

- favicon.svg: 1 KB 以内
- og-image.png: 200 KB 以内（圧縮）
- demo-*.png: 各 300 KB 以内
- demo.mp4: 10 MB 以内（または YouTube 埋め込み）

## 404 時の挙動

未配置のアセットはブラウザが 404 を返すが、LP の本文レンダリングには影響しない。
OGP 画像が 404 のまま公開すると SNS シェア時にアイキャッチが出ないため、公開前には配置を推奨。
