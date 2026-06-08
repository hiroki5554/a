#!/usr/bin/env python3
import os
import sys
from datetime import datetime, timezone, timedelta
import anthropic

JST = timezone(timedelta(hours=9))


def generate_brief() -> str:
    today = datetime.now(JST).strftime("%Y-%m-%d")
    output_path = f"briefs/brief-{today}.md"

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    prompt = f"""今日は{today}（JST）です。

過去24時間のAI・暗号資産に関するニュースを検索し、最も重要な5つのストーリーを選んでください。

選ぶ基準：
- 驚くべき、または直感に反する内容
- ビルダー（開発者・起業家）や投資家にとって本当の意味合いがあるもの
- 単なる価格変動や宣伝ではなく、構造的な変化を示すもの

各ストーリーについて以下の形式で書いてください：

## [番号]. [見出し]

**要約**: 2文で核心を伝える。

**なぜ重要か**: 1〜2文。ビルダーまたは投資家の視点から具体的に。

---

トーン：直接的で分析的。余計な言葉なし。全体で3分以内に読めること。
冒頭に日付と「AI & Crypto Daily Brief」というタイトルを入れること。"""

    with client.messages.stream(
        model="claude-opus-4-8",
        max_tokens=4096,
        thinking={"type": "adaptive"},
        tools=[{"type": "web_search_20260209", "name": "web_search"}],
        messages=[{"role": "user", "content": prompt}],
        betas=["web-search-2025-03-05"],
    ) as stream:
        response = stream.get_final_message()

    text_blocks = [block.text for block in response.content if hasattr(block, "text")]
    content = "\n\n".join(text_blocks).strip()

    os.makedirs("briefs", exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content + "\n")

    print(f"Brief saved: {output_path}")
    return output_path


if __name__ == "__main__":
    generate_brief()
