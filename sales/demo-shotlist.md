# デモ素材 撮影ショットリスト

LP ファーストビュー直下に埋め込む Before/After スクリーンショットと 30 秒動画の撮影台本。
撮影は `Code.gs` の `フォーム仕分け → デモデータを投入` で整う状態を使う。

---

## 事前準備

1. 新規 Google スプレッドシートを作成（名前：`フォーム仕分けデモ`）
2. 拡張機能 → Apps Script → `Code.gs` を貼り付けて保存
3. スプレッドシート再読み込み → メニュー「フォーム仕分け」表示確認
4. `フォーム仕分け → デモデータを投入` 実行
5. ブラウザは Chrome、ズーム 100%、ウィンドウ幅 1280px（16:10 のトリミングで使いやすい）
6. シート左側のサイドバー（シート一覧）を必ず表示しておく

---

## Before/After スクリーンショット（静止画・最優先）

### 1. Before：`フォームの回答 1` 全件表示

- 対象シート：`フォームの回答 1`
- 見せたい情報：「混在した10件の回答」
- 枠に収める：ヘッダ行＋10行分のデータ
- 画像名：`demo-before.png`
- 推奨サイズ：1600×900（2x で Retina 対応）

### 2. After：カテゴリ別シートがタブ一覧に並んだ状態

- まず `フォーム仕分け → 全件を一括仕分け` を実行
- 対象画面：シート下部のタブ一覧（`フォームの回答 1` / `学生申込` / `関係者申込` / `団体対応` / `4月20日分` / `_config` / `_rules` / ...）
- 見せたい情報：「カテゴリ別にシートが自動生成された」
- 画像名：`demo-after-tabs.png`

### 3. After：`学生申込` シートを開いた状態

- 対象シート：`学生申込`（3件入っている）
- 見せたい情報：「カテゴリだけが絞り込まれ、ヘッダも整形されている」
- 画像名：`demo-after-filtered.png`

### 4. 設定シート：`_rules` の中身

- 対象シート：`_rules`
- 見せたい情報：「スプレッドシート上でルールを編集できる（コード不要）」
- 画像名：`demo-rules-sheet.png`

---

## 30秒動画スクリプト

尺 0:00〜0:30。字幕（キャプション）前提。音声ナレーションは無しでも成立する構成。

| 時間 | 画面 | テロップ | 操作 |
|---|---|---|---|
| 0:00 | `フォームの回答 1` に混在10件 | 「回答が1枚のシートに溜まっていく」 | 静止 |
| 0:04 | 同上、手動でコピペする様子（フェイク） | 「毎週のコピペ仕分け…」 | セル範囲をドラッグして色をつける |
| 0:08 | メニュー「フォーム仕分け」を開く | 「ワンクリックで解決」 | メニュー展開 |
| 0:10 | 「全件を一括仕分け」をクリック | 「全件を一括仕分け」 | クリック |
| 0:12 | ダイアログ「仕分け完了 振り分け:10件」 | ↑ | ダイアログ表示 |
| 0:14 | タブ一覧が自動生成されるのを撮影 | 「カテゴリ別シートを自動生成」 | タブ下部ズーム |
| 0:18 | `学生申込` タブをクリック | 「学生の申込だけ」 | タブ切り替え |
| 0:21 | `関係者申込` タブをクリック | 「関係者だけ」 | タブ切り替え |
| 0:24 | `_rules` シートを表示 | 「ルールはスプレッドシートで編集」 | 切り替え |
| 0:27 | LP URL + CTA 表示 | 「導入7日／月額費用なし／全額返金保証」 | 固定テロップ |
| 0:30 | END | — | — |

### 撮影ツール（推奨）

- macOS 標準：`⌘ + Shift + 5` の画面収録（無料・十分な画質）
- 代替：Loom / QuickTime / OBS Studio
- 編集：iMovie / DaVinci Resolve（無料）で時間カットとテロップ追加のみ

### 書き出し

- 解像度：1280×720 MP4（H.264）
- ファイルサイズ目標：<10 MB（`docs/assets/demo.mp4` に置く or YouTube 限定公開）
- YouTube 限定公開の場合、LP で iframe 埋め込み

---

## LP への組み込み手順

撮影完了後：

1. 画像は `docs/assets/` に配置（`demo-before.png` など）
2. `docs/assets/.nojekyll` は `docs/.nojekyll` が再帰的に効くため不要
3. `docs/index.html` の PROBLEM セクション上部または HERO 直下に以下を挿入：

```html
<section class="section" style="background: #fff;">
  <div class="container-narrow mx-auto">
    <h2 class="h2 text-center">実際の動き</h2>
    <div class="mt-8 grid sm:grid-cols-2 gap-4">
      <figure>
        <img src="./assets/demo-before.png" alt="仕分け前：1枚のシートに混在した回答" class="rounded-xl border border-slate-200" />
        <figcaption class="text-xs muted mt-2 text-center">Before：回答が1枚に混在</figcaption>
      </figure>
      <figure>
        <img src="./assets/demo-after-tabs.png" alt="仕分け後：カテゴリ別シートに自動で分離" class="rounded-xl border border-slate-200" />
        <figcaption class="text-xs muted mt-2 text-center">After：カテゴリ別に自動生成</figcaption>
      </figure>
    </div>
  </div>
</section>
```

動画を埋め込む場合（YouTube 限定公開）：

```html
<div class="aspect-video mt-8">
  <iframe class="w-full h-full rounded-xl" src="https://www.youtube.com/embed/VIDEO_ID" title="フォーム仕分け自動化パック デモ" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
```

---

## 撮り直しチェック

- [ ] Before/After の画面構成が揃っている（ズーム率・ウィンドウ幅）
- [ ] 個人情報を含む既存タブが写り込んでいない
- [ ] 日付・時刻表示が整合している（デモデータ投入直後の撮影）
- [ ] テロップがモバイル幅でも読める（14px 以上相当）
