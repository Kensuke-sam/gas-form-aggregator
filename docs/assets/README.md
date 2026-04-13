# docs/assets/ — LP 用静的アセット

LP（`docs/index.html`）から参照される画像・アイコン類。

| ファイル | 用途 | 状態 |
|---|---|---|
| `favicon.svg` | 各種ブラウザタブ用アイコン（ベクタ） | 配置済み |
| `favicon.ico` | レガシーブラウザ用 fallback | **未配置（任意）** |
| `og-image.svg` | OGP ソース（1200×630 ベクタ） | 配置済み |
| `og-image.png` | OGP / Twitter カード画像（1200×630 PNG） | 配置済み |
| `demo-before.png` | デモ Before スクリーンショット | **未配置** |
| `demo-after-tabs.png` | デモ After（タブ一覧） | **未配置** |
| `demo-after-filtered.png` | デモ After（絞り込み後シート） | **未配置** |
| `demo-rules-sheet.png` | `_rules` シートの中身 | **未配置** |
| `demo.mp4` | 30秒デモ動画（任意・YouTube 限定公開で代替可） | **未配置** |

## 撮影手順

`sales/demo-shotlist.md` を参照。

## og-image.png の作り方

`og-image.svg` を整備済みなので、PNG への変換だけでよい。

### 方法A: ブラウザでスクリーンショット（最速）
1. `npm run serve` でローカル配信を起動
2. <http://localhost:4173/assets/og-image.svg> を開く
3. ブラウザウィンドウを 1200×630 にリサイズしてスクリーンショット
4. `og-image.png` として保存

### 方法B: CLI で変換
```bash
# ImageMagick
magick docs/assets/og-image.svg -resize 1200x630 docs/assets/og-image.png

# or rsvg-convert
rsvg-convert -w 1200 -h 630 docs/assets/og-image.svg -o docs/assets/og-image.png
```

### 方法C: オンラインコンバータ
<https://cloudconvert.com/svg-to-png> など。1200×630 を指定して書き出し。

### デザインを変更したい場合
`og-image.svg` を編集（Figma / Inkscape / テキストエディタ）して再エクスポート。

## 容量の目安

- favicon.svg: 1 KB 以内
- og-image.png: 200 KB 以内（圧縮）
- demo-*.png: 各 300 KB 以内
- demo.mp4: 10 MB 以内（または YouTube 埋め込み）

## 404 時の挙動

未配置のアセットはブラウザが 404 を返すが、LP の本文レンダリングには影響しない。
OGP 画像が 404 のまま公開すると SNS シェア時にアイキャッチが出ないため、公開前には配置を推奨。
