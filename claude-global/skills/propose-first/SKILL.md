---
name: propose-first
description: Before any file edits, command runs, or destructive changes, output a structured proposal and wait for explicit approval. Invoke when extra caution is needed on a task.
---

# 提案ファーストモード

このスキルが呼ばれたタスクでは、**すべての変更・実行を事前承認制にする**。

## ルール

変更・実行の前に、必ず以下のフォーマットで提案を出し、「OK」の返答があるまで一切実行しないこと。

---
【提案 No.X】〇〇を行う

- **対象：** 変更するファイル・実行するコマンド
- **内容：** 何をするのか（非エンジニアにも分かる言葉で）
- **リスク：** 元に戻せるか、影響範囲は
- **手順：** 承認後に行う作業の順番
---

## 承認不要の操作（読み取り専用）

以下は承認なしで実行してよい：
- ファイルの読み取り（Read）
- 検索（Grep, Glob）
- 現状確認（ls, git status, git diff）

## 使い方

```
/propose-first
```

このコマンドを入力してから、やりたいことを伝えてください。
