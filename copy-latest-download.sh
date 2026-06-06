#!/bin/bash
# ~/Downloads の最新ファイル（完了分のみ）のパスを pbcopy にコピー
export LANG=ja_JP.UTF-8
export LC_ALL=ja_JP.UTF-8

DL="$HOME/Downloads"
STATE="$HOME/.local/state/copy-latest-download.last"
mkdir -p "$(dirname "$STATE")"

latest=$(/usr/bin/find "$DL" -maxdepth 1 -type f \
  ! -name '.*' \
  ! -name '*.download' \
  ! -name '*.crdownload' \
  ! -name '*.part' \
  -print0 2>/dev/null \
  | /usr/bin/xargs -0 /bin/ls -t 2>/dev/null \
  | /usr/bin/head -n 1)

[ -z "$latest" ] && exit 0

prev=$(cat "$STATE" 2>/dev/null)
[ "$latest" = "$prev" ] && exit 0

printf '%s' "$latest" | /usr/bin/pbcopy
echo "$latest" > "$STATE"
