# 納品物テンプレ

お客様にお渡しするドキュメント群。PDFに書き出して納品する。

| ファイル | 納品先 | 内容 |
|---|---|---|
| `setup-guide.md` | お客様 | 運用マニュアル本編 |
| `rule-reference.md` | お客様 | `_rules` の書き方リファレンス |
| `privacy-and-permissions.md` | お客様 | データ・権限の取り扱い |
| `sample-data.md` | お客様（参考） | デモ用サンプルデータ仕様 |
| `handoff-checklist.md` | 社内用 | 納品前チェックリスト |
| `verification-checklist.md` | 社内用 | `Code.gs` 更新時の手動動作確認項目 |

## 納品パッケージ構成（理想形）

```
納品物一式.zip
├── 01_運用マニュアル.pdf           ← setup-guide.md
├── 02_ルール書き方ガイド.pdf        ← rule-reference.md
├── 03_データと権限について.pdf       ← privacy-and-permissions.md
├── 04_設定シート記入例.pdf          ← 実際の_config/_rulesのスクショ
├── 05_テスト送信結果.png            ← Before/After のスクショ
└── 06_権限返却の手順.pdf            ← privacy-and-permissionsに同梱可
```
