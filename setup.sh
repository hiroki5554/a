#!/bin/bash
# Downloads→クリップボード自動コピー セットアップスクリプト
# Mac上で実行してください: bash setup.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BIN_DIR="$HOME/.local/bin"
PLIST_DIR="$HOME/Library/LaunchAgents"
SCRIPT_DEST="$BIN_DIR/copy-latest-download.sh"
PLIST_DEST="$PLIST_DIR/com.example.copy-latest-download.plist"
LABEL="com.example.copy-latest-download"

echo "=== Downloads クリップボード自動コピー セットアップ ==="
echo ""

# 1. スクリプトを配置
echo "[1/3] スクリプトを配置中..."
mkdir -p "$BIN_DIR"
cp "$SCRIPT_DIR/copy-latest-download.sh" "$SCRIPT_DEST"
chmod +x "$SCRIPT_DEST"
echo "      → $SCRIPT_DEST"

# 2. plist を生成（絶対パスを埋め込み）
echo "[2/3] LaunchAgent plist を生成中..."
mkdir -p "$PLIST_DIR"
sed \
  -e "s|SCRIPT_PATH_PLACEHOLDER|$SCRIPT_DEST|g" \
  -e "s|DOWNLOADS_PATH_PLACEHOLDER|$HOME/Downloads|g" \
  "$SCRIPT_DIR/com.example.copy-latest-download.plist" \
  > "$PLIST_DEST"
echo "      → $PLIST_DEST"

# 3. LaunchAgent をロード（既存があればアンロードしてから）
echo "[3/3] LaunchAgent をロード中..."
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST_DEST"
echo "      → ロード完了"

echo ""
echo "=== セットアップ完了 ==="
echo ""
echo "【次の手順】フルディスクアクセスを付与してください:"
echo ""
echo "  1. システム設定 → プライバシーとセキュリティ → フルディスクアクセス"
echo "  2. 左下の 🔒 をクリックして認証"
echo "  3. 「+」ボタン → /bin/bash を選択して追加"
echo "     (/bin/bash は Finder で Shift+Cmd+G → /bin と入力すると見つけられます)"
echo "  4. /bin/bash のトグルがオンになっていることを確認"
echo ""
echo "付与後、以下のコマンドで再起動してください:"
echo ""
echo "  launchctl kickstart -k gui/\$(id -u)/$LABEL"
echo ""
