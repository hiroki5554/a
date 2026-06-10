"use strict";

// モンスターは 64x64 の論理座標で描き、呼び出し側でスケールする。
// pal = { main, sub, accent }

function _el(ctx, cx, cy, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function _tri(ctx, x1, y1, x2, y2, x3, y3, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fill();
}

function _eyes(ctx, cx, cy, gap, r) {
  _el(ctx, cx - gap, cy, r, r * 1.3, "#202020");
  _el(ctx, cx + gap, cy, r, r * 1.3, "#202020");
  _el(ctx, cx - gap + 1, cy - 1, r * 0.35, r * 0.45, "#ffffff");
  _el(ctx, cx + gap + 1, cy - 1, r * 0.35, r * 0.45, "#ffffff");
}

const SHAPE_PAINTERS = {
  // ネコ・キツネ・リス系
  beast(ctx, pal) {
    _el(ctx, 32, 14, 7, 10, pal.main);                 // しっぽ(頭の後ろに見せる)
    _tri(ctx, 18, 22, 14, 6, 28, 14, pal.main);        // 左耳
    _tri(ctx, 46, 22, 50, 6, 36, 14, pal.main);        // 右耳
    _tri(ctx, 19, 18, 17, 9, 26, 14, pal.accent);      // 耳の内側
    _tri(ctx, 45, 18, 47, 9, 38, 14, pal.accent);
    _el(ctx, 32, 44, 17, 14, pal.main);                // 体
    _el(ctx, 32, 48, 10, 9, pal.sub);                  // おなか
    _el(ctx, 32, 24, 15, 13, pal.main);                // 頭
    _eyes(ctx, 32, 23, 6, 2.5);
    _el(ctx, 32, 29, 2, 1.5, pal.accent);              // 鼻
    _el(ctx, 22, 56, 5, 4, pal.main);                  // 足
    _el(ctx, 42, 56, 5, 4, pal.main);
  },

  // スライム・モグラ系
  blob(ctx, pal) {
    _el(ctx, 32, 38, 20, 20, pal.main);                // 体
    _el(ctx, 32, 46, 12, 10, pal.sub);                 // おなか
    _tri(ctx, 14, 26, 10, 14, 22, 20, pal.accent);     // 左の飾り
    _tri(ctx, 50, 26, 54, 14, 42, 20, pal.accent);     // 右の飾り
    _eyes(ctx, 32, 32, 7, 3);
    _el(ctx, 32, 41, 3, 2, pal.accent);                // 口
  },

  // 鳥系
  bird(ctx, pal) {
    _tri(ctx, 32, 6, 28, 16, 36, 16, pal.accent);      // とさか
    _el(ctx, 32, 40, 16, 16, pal.main);                // 体
    _el(ctx, 18, 40, 7, 12, pal.sub);                  // 左羽
    _el(ctx, 46, 40, 7, 12, pal.sub);                  // 右羽
    _el(ctx, 32, 22, 12, 11, pal.main);                // 頭
    _eyes(ctx, 32, 21, 5, 2.5);
    _tri(ctx, 32, 26, 28, 29, 36, 29, pal.sub);        // くちばし
    _tri(ctx, 26, 56, 22, 62, 30, 62, pal.sub);        // 足
    _tri(ctx, 38, 56, 34, 62, 42, 62, pal.sub);
  },

  // 花系
  flower(ctx, pal) {
    for (let i = 0; i < 6; i++) {                      // 花びら
      const a = (Math.PI * 2 * i) / 6;
      _el(ctx, 32 + Math.cos(a) * 12, 20 + Math.sin(a) * 12, 7, 7, pal.main);
    }
    _el(ctx, 32, 20, 9, 9, pal.accent);                // 花の中心
    ctx.fillStyle = pal.sub;
    ctx.fillRect(30, 28, 4, 16);                       // 茎
    _el(ctx, 32, 48, 14, 12, pal.sub);                 // 葉の体
    _eyes(ctx, 32, 20, 4, 2);
    _el(ctx, 22, 46, 7, 4, pal.sub);                   // 左葉
    _el(ctx, 42, 46, 7, 4, pal.sub);
  },

  // 虫系
  bug(ctx, pal) {
    _el(ctx, 32, 46, 14, 12, pal.main);                // 腹
    _el(ctx, 32, 30, 11, 10, pal.main);                // 胸
    ctx.strokeStyle = pal.accent;
    ctx.lineWidth = 2;
    for (const s of [-1, 1]) {                         // 脚
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(32 + s * 10, 38 + i * 7);
        ctx.lineTo(32 + s * 20, 42 + i * 7);
        ctx.stroke();
      }
    }
    _el(ctx, 32, 16, 9, 8, pal.sub);                   // 頭
    ctx.beginPath();                                   // 触角
    ctx.moveTo(28, 10); ctx.lineTo(24, 4);
    ctx.moveTo(36, 10); ctx.lineTo(40, 4);
    ctx.stroke();
    _eyes(ctx, 32, 15, 4, 2);
    ctx.fillStyle = pal.accent;                        // 模様
    ctx.fillRect(24, 44, 16, 3);
  },

  // 魚・フグ系
  fish(ctx, pal) {
    _tri(ctx, 14, 32, 4, 22, 4, 42, pal.sub);          // 尾びれ
    _el(ctx, 34, 32, 20, 16, pal.main);                // 体
    _el(ctx, 38, 38, 11, 8, pal.sub);                  // 腹
    _tri(ctx, 32, 18, 28, 8, 40, 12, pal.sub);         // 背びれ
    _eyes(ctx, 42, 28, 5, 2.5);
    _el(ctx, 50, 34, 3, 2, pal.accent);                // 口
    for (let i = 0; i < 4; i++) {                      // トゲ
      const a = Math.PI * (0.15 + i * 0.23);
      _tri(ctx, 34 + Math.cos(a) * 19, 32 - Math.sin(a) * 15,
                34 + Math.cos(a) * 26, 32 - Math.sin(a) * 21,
                34 + Math.cos(a + 0.2) * 18, 32 - Math.sin(a + 0.2) * 14, pal.accent);
    }
  },

  // カメ・トカゲ系
  turtle(ctx, pal) {
    _el(ctx, 32, 40, 18, 15, pal.sub);                 // 甲羅
    _el(ctx, 32, 40, 12, 10, pal.accent);              // 甲羅の模様
    _el(ctx, 16, 52, 6, 5, pal.main);                  // 足
    _el(ctx, 48, 52, 6, 5, pal.main);
    _el(ctx, 44, 22, 10, 9, pal.main);                 // 頭
    _eyes(ctx, 44, 21, 4, 2);
    _el(ctx, 50, 25, 2, 1.5, "#202020");               // 口
    _tri(ctx, 40, 12, 44, 4, 48, 12, pal.accent);      // 頭のトゲ
  },

  // ゴーレム系
  golem(ctx, pal) {
    _el(ctx, 32, 38, 18, 17, pal.main);                // 体(岩)
    _el(ctx, 24, 30, 6, 5, pal.sub);                   // 岩の模様
    _el(ctx, 40, 44, 5, 4, pal.sub);
    _el(ctx, 12, 40, 6, 8, pal.sub);                   // 左腕
    _el(ctx, 52, 40, 6, 8, pal.sub);                   // 右腕
    _el(ctx, 22, 56, 7, 5, pal.accent);                // 足
    _el(ctx, 42, 56, 7, 5, pal.accent);
    _eyes(ctx, 32, 30, 6, 2.5);
    ctx.fillStyle = pal.accent;                        // 口
    ctx.fillRect(28, 38, 8, 2);
  },
};

// モンスターを描く。size = 描画サイズ(px)。back=true で後ろ姿(左右反転+暗め)
function drawMonster(ctx, speciesId, x, y, size, back) {
  const sp = SPECIES[speciesId];
  ctx.save();
  ctx.translate(x, y);
  if (back) {
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
  }
  ctx.scale(size / 64, size / 64);
  SHAPE_PAINTERS[sp.shape](ctx, sp.pal);
  if (back) {
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(32, 36, 26, 28, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// 主人公(フィールド用)。dir = "down"|"up"|"left"|"right"
function drawPlayer(ctx, px, py, ts, dir) {
  const cx = px + ts / 2;
  ctx.fillStyle = "#30404e";                           // 体
  ctx.fillRect(cx - ts * 0.22, py + ts * 0.42, ts * 0.44, ts * 0.42);
  _el(ctx, cx, py + ts * 0.3, ts * 0.26, ts * 0.26, "#f8d0a0");  // 顔
  ctx.fillStyle = "#d03020";                           // 帽子
  ctx.beginPath();
  ctx.arc(cx, py + ts * 0.26, ts * 0.27, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(cx - ts * 0.3, py + ts * 0.22, ts * 0.6, ts * 0.07);
  if (dir !== "up") {
    ctx.fillStyle = "#202020";                         // 目
    const off = dir === "left" ? -ts * 0.12 : dir === "right" ? ts * 0.12 : 0;
    if (dir === "down") {
      ctx.fillRect(cx - ts * 0.12, py + ts * 0.3, ts * 0.06, ts * 0.08);
      ctx.fillRect(cx + ts * 0.06, py + ts * 0.3, ts * 0.06, ts * 0.08);
    } else {
      ctx.fillRect(cx + off, py + ts * 0.3, ts * 0.06, ts * 0.08);
    }
  }
}
