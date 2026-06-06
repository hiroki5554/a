---
name: strategy
description: 戦略分析チームを起動する。テーマを渡すだけで5つのエージェントが順番に動き、最終レポートをoutput/articles/に保存する。「〇〇について戦略分析して」などの入力で発動。
---

# strategy：戦略分析チーム起動スキル

## チーム構成

| エージェント | 役割 | 実行タイミング |
|------------|------|-------------|
| question-designer | 問いの構造化・調査指示書の作成 | 最初 |
| market-researcher | 市場・競合・トレンドの調査 | 並列（2番目） |
| quantitative-analyst | 数値・KPI・データの分析 | 並列（2番目） |
| strategy-designer | 戦略オプション3案の設計 | 3番目 |
| critical-reviewer | 弱点・リスク・見落としの指摘 | 最後 |

## 実行手順

1. ユーザーから分析テーマを受け取る（未指定なら確認する）
2. **question-designerサブエージェント**を起動し、問いの構造化と調査指示書を作成させる
3. 調査指示書をもとに **market-researcher** と **quantitative-analyst** を**並列**で起動する
4. 両エージェントの結果をもとに **strategy-designer** を起動し、戦略オプション3案を設計させる
5. **critical-reviewer** を起動し、戦略案の批判的レビューを行わせる
6. 全エージェントの出力を統合した最終レポートを生成する
7. `/home/user/business/output/articles/YYYY-MM-DD_strategy_{テーマ}.md` として保存する
8. ユーザーに完了を報告し、推奨案と主要リスクを3行で要約する

## 最終レポートの構成

```markdown
# 戦略分析レポート：{テーマ}
分析日：{TODAY}

## エグゼクティブサマリー（3行）
...

## 問いの設計
{question-designerの出力}

## 市場調査
{market-researcherの出力}

## 定量分析
{quantitative-analystの出力}

## 戦略オプション
{strategy-designerの出力}

## 批判的レビュー
{critical-reviewerの出力}

## 最終推奨
...
```

## 使い方

```
/strategy 〇〇について分析してほしい
```

または

```
/strategy
```
と入力するとテーマを確認します。

## 注意事項
- 各エージェントはサブエージェントとして起動し、メインコンテキストを汚さない
- クライアント名・個人情報は含めない（A社・B案件等の匿名表記を使う）
- 分析には30〜60分程度かかる場合がある
