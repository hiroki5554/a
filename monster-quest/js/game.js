"use strict";

const TS = 32;                 // タイル描画サイズ(px)
const SAVE_KEY = "monster-quest-save";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

// ===== 入力 =====
const KEY_MAP = {
  ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
  w: "up", s: "down", a: "left", d: "right",
  W: "up", S: "down", A: "left", D: "right",
  z: "A", Z: "A", Enter: "A", " ": "A",
  x: "B", X: "B", Escape: "B",
};
const held = new Set();

document.addEventListener("keydown", e => {
  const btn = KEY_MAP[e.key];
  if (!btn) return;
  e.preventDefault();
  if (!e.repeat) game.onButton(btn);
  held.add(btn);
});
document.addEventListener("keyup", e => {
  const btn = KEY_MAP[e.key];
  if (btn) held.delete(btn);
});

// ===== ゲーム本体 =====
const game = {
  state: "title",          // title | starter | field | dialog | menu | party | battle
  titleIdx: 0,
  starterIdx: 0,
  menuIdx: 0,

  party: [],
  balls: 10,
  px: START_X, py: START_Y,        // タイル座標
  dir: "down",
  moving: null,                    // {fx,fy,tx,ty,t} 移動アニメ
  encounterCooldown: 0,

  dialog: null,                    // {lines, idx, onDone}
  battle: null,

  hasSave() {
    try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
  },

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        party: this.party, balls: this.balls, px: this.px, py: this.py,
      }));
      return true;
    } catch (e) { return false; }
  },

  load() {
    try {
      const data = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!data || !data.party || !data.party.length) return false;
      this.party = data.party;
      this.balls = data.balls;
      this.px = data.px; this.py = data.py;
      return true;
    } catch (e) { return false; }
  },

  showDialog(lines, onDone) {
    this.dialog = { lines, idx: 0, onDone: onDone || null };
    this.state = "dialog";
  },

  // ===== ボタン入力(押した瞬間) =====
  onButton(btn) {
    switch (this.state) {
      case "title": this.titleInput(btn); break;
      case "starter": this.starterInput(btn); break;
      case "field": this.fieldInput(btn); break;
      case "dialog":
        if (btn === "A") {
          this.dialog.idx += 1;
          if (this.dialog.idx >= this.dialog.lines.length) {
            const cb = this.dialog.onDone;
            this.dialog = null;
            this.state = "field";
            if (cb) cb();
          }
        }
        break;
      case "menu": this.menuInput(btn); break;
      case "party":
        if (btn === "A" || btn === "B") this.state = "field";
        break;
      case "battle": this.battle.handleInput(btn); break;
    }
  },

  titleInput(btn) {
    const n = this.hasSave() ? 2 : 1;
    if (btn === "up") this.titleIdx = (this.titleIdx + n - 1) % n;
    if (btn === "down") this.titleIdx = (this.titleIdx + 1) % n;
    if (btn !== "A") return;
    if (this.titleIdx === 1 && this.load()) {
      this.state = "field";
      this.showDialog(["(つづきから 再開した!)"]);
    } else {
      this.state = "starter";
      this.starterIdx = 0;
    }
  },

  starterInput(btn) {
    if (btn === "left") this.starterIdx = (this.starterIdx + 2) % 3;
    if (btn === "right") this.starterIdx = (this.starterIdx + 1) % 3;
    if (btn !== "A") return;
    const id = STARTERS[this.starterIdx];
    this.party = [makeMonster(id, 5)];
    this.balls = 10;
    this.px = START_X; this.py = START_Y; this.dir = "down";
    this.state = "field";
    this.showDialog([
      `${SPECIES[id].name}を 相棒に選んだ!`,
      "草むらを歩くと 野生のモンスターが あらわれるぞ。",
      "弱らせてから ボールを投げると 捕まえられる!",
      "ピンチのときは 家のピンクのマットで 回復しよう。",
    ]);
  },

  fieldInput(btn) {
    if (btn === "B") { this.state = "menu"; this.menuIdx = 0; return; }
    if (btn !== "A") return;
    // 目の前のタイルを調べる
    const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[this.dir];
    if (tileAt(this.px + d[0], this.py + d[1]) === "S") {
      this.showDialog(SIGN_TEXTS);
    }
  },

  menuInput(btn) {
    const items = 3;
    if (btn === "up") this.menuIdx = (this.menuIdx + items - 1) % items;
    if (btn === "down") this.menuIdx = (this.menuIdx + 1) % items;
    if (btn === "B") { this.state = "field"; return; }
    if (btn !== "A") return;
    if (this.menuIdx === 0) { this.state = "party"; }
    else if (this.menuIdx === 1) {
      const ok = this.save();
      this.showDialog([ok ? "セーブしました!" : "セーブに 失敗しました…"]);
    } else { this.state = "field"; }
  },

  // ===== 更新 =====
  update(dt) {
    if (this.state === "battle") {
      if (this.battle.done) this.endBattle();
      return;
    }
    if (this.state !== "field") return;

    // 移動アニメ
    if (this.moving) {
      this.moving.t += dt / 160;
      if (this.moving.t >= 1) {
        this.px = this.moving.tx;
        this.py = this.moving.ty;
        this.moving = null;
        this.onArrive();
      }
      return;
    }
    // 新しい移動入力
    for (const dir of ["up", "down", "left", "right"]) {
      if (!held.has(dir)) continue;
      this.dir = dir;
      const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
      const tx = this.px + d[0], ty = this.py + d[1];
      if (!SOLID_TILES.has(tileAt(tx, ty))) {
        this.moving = { fx: this.px, fy: this.py, tx, ty, t: 0 };
      }
      break;
    }
  },

  onArrive() {
    const tile = tileAt(this.px, this.py);
    if (tile === "D") {
      for (const m of this.party) { m.hp = m.maxHp; }
      this.balls = 10;
      this.save();
      this.showDialog([
        "モンスターたちは 元気になった!",
        "キャプチャボールも 補充した! (セーブ完了)",
      ]);
      return;
    }
    if (this.encounterCooldown > 0) { this.encounterCooldown -= 1; return; }
    if ((tile === "G" || tile === "H") && Math.random() < ENCOUNTER_RATE) {
      const table = ENCOUNTER_TABLES[tile];
      const sp = table.species[Math.floor(Math.random() * table.species.length)];
      const lv = table.minLv + Math.floor(Math.random() * (table.maxLv - table.minLv + 1));
      this.battle = new Battle(this, makeMonster(sp, lv));
      this.state = "battle";
    }
  },

  endBattle() {
    const result = this.battle.result;
    const caught = this.battle.result === "catch" ? this.battle.enemy.name : null;
    this.battle = null;
    this.encounterCooldown = 3;
    this.state = "field";
    if (result === "lose") {
      this.px = START_X; this.py = START_Y; this.dir = "down";
      for (const m of this.party) { m.hp = m.maxHp; }
      this.showDialog(["急いで 家に戻って モンスターを 休ませた…"]);
    } else if (result === "catch") {
      this.showDialog([`${caught}が 仲間に加わった!`]);
    }
  },

  // ===== 描画 =====
  draw() {
    ctx.clearRect(0, 0, W, H);
    switch (this.state) {
      case "title": this.drawTitle(); break;
      case "starter": this.drawStarter(); break;
      case "battle": this.battle.draw(ctx, W, H); break;
      default:
        this.drawField();
        if (this.state === "dialog") this.drawDialog();
        if (this.state === "menu") this.drawMenu();
        if (this.state === "party") this.drawParty();
    }
  },

  drawTitle() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#203060");
    g.addColorStop(1, "#509060");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    drawText(ctx, "モンスタークエスト", W / 2 - 240, 180, 52, "#ffe060");
    drawText(ctx, "- 草原の冒険 -", W / 2 - 110, 240, 28, "#fff");
    // 看板モンスター
    drawMonster(ctx, "hibanyan", W / 2 - 220, 280, 140, false);
    drawMonster(ctx, "aquamo", W / 2 - 60, 280, 140, false);
    drawMonster(ctx, "leafin", W / 2 + 100, 280, 140, false);
    const opts = this.hasSave() ? ["はじめから", "つづきから"] : ["はじめから"];
    for (let i = 0; i < opts.length; i++) {
      drawText(ctx, (this.titleIdx === i ? "▶ " : "   ") + opts[i], W / 2 - 90, 480 + i * 40, 28, "#fff");
    }
  },

  drawStarter() {
    ctx.fillStyle = "#284058";
    ctx.fillRect(0, 0, W, H);
    drawText(ctx, "相棒にする モンスターを選ぼう!", W / 2 - 240, 90, 32, "#fff");
    for (let i = 0; i < 3; i++) {
      const id = STARTERS[i];
      const sp = SPECIES[id];
      const x = W / 2 - 330 + i * 240;
      if (this.starterIdx === i) {
        ctx.fillStyle = "rgba(255,224,96,0.25)";
        ctx.fillRect(x - 20, 130, 220, 320);
        ctx.strokeStyle = "#ffe060";
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 20, 130, 220, 320);
      }
      drawMonster(ctx, id, x, 160, 180, false);
      drawText(ctx, sp.name, x + 30, 390, 26, "#fff");
      drawTypeTag(ctx, sp.type, x + 45, 405);
    }
    drawText(ctx, "←→で選択、Zで決定", W / 2 - 130, 510, 22, "#ccd");
  },

  drawField() {
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        drawTile(tileAt(x, y), x * TS, y * TS);
      }
    }
    // プレイヤー
    let ppx = this.px * TS, ppy = this.py * TS;
    if (this.moving) {
      const m = this.moving;
      ppx = (m.fx + (m.tx - m.fx) * m.t) * TS;
      ppy = (m.fy + (m.ty - m.fy) * m.t) * TS;
    }
    drawPlayer(ctx, ppx, ppy, TS, this.dir);
  },

  drawDialog() {
    drawBox(ctx, 16, H - 120, W - 32, 104);
    drawText(ctx, this.dialog.lines[this.dialog.idx], 44, H - 62, 24, "#fff");
    drawText(ctx, "▼", W - 60, H - 36, 20, "#fff");
  },

  drawMenu() {
    const items = ["モンスター", "セーブ", "とじる"];
    drawBox(ctx, W - 260, 16, 244, 40 + items.length * 42);
    for (let i = 0; i < items.length; i++) {
      drawText(ctx, (this.menuIdx === i ? "▶ " : "   ") + items[i], W - 236, 60 + i * 42, 24, "#fff");
    }
  },

  drawParty() {
    drawBox(ctx, W / 2 - 300, 60, 600, 80 + this.party.length * 80);
    drawText(ctx, `手持ちモンスター   ボール ×${this.balls}`, W / 2 - 270, 104, 24, "#fff");
    for (let i = 0; i < this.party.length; i++) {
      const m = this.party[i];
      const y = 130 + i * 80;
      drawMonster(ctx, m.speciesId, W / 2 - 280, y, 64, false);
      drawText(ctx, m.name, W / 2 - 200, y + 28, 24, m.hp > 0 ? "#fff" : "#888");
      drawTypeTag(ctx, m.type, W / 2 - 30, y + 8);
      drawText(ctx, `Lv${m.level}`, W / 2 + 70, y + 28, 22, "#fff");
      drawHpBar(ctx, W / 2 - 200, y + 40, 320, 14, m.hp / m.maxHp);
      drawText(ctx, `${m.hp}/${m.maxHp}`, W / 2 + 140, y + 54, 18, "#ccc");
    }
    drawText(ctx, "Z / Xで とじる", W / 2 + 130, 80 + this.party.length * 80 + 36, 16, "#aaa");
  },
};

// ===== タイル描画 =====
function drawTile(tile, x, y) {
  // 共通の草地ベース
  ctx.fillStyle = "#88c860";
  ctx.fillRect(x, y, TS, TS);

  switch (tile) {
    case ".":
      ctx.fillStyle = "#d8c890";
      ctx.fillRect(x, y, TS, TS);
      break;
    case ",":
      ctx.fillStyle = "#78b850";
      ctx.fillRect(x + 6, y + 8, 4, 4);
      ctx.fillRect(x + 20, y + 18, 4, 4);
      break;
    case "f":
      ctx.fillStyle = "#f06880";
      ctx.fillRect(x + 8, y + 8, 6, 6);
      ctx.fillStyle = "#f8e060";
      ctx.fillRect(x + 20, y + 18, 6, 6);
      break;
    case "G":
    case "H": {
      ctx.fillStyle = tile === "G" ? "#50a848" : "#3c9858";
      ctx.fillRect(x, y, TS, TS);
      ctx.fillStyle = tile === "G" ? "#3c8838" : "#2a7844";
      for (const [tx, ty] of [[4, 6], [16, 4], [24, 12], [8, 20], [20, 22]]) {
        ctx.beginPath();
        ctx.moveTo(x + tx, y + ty + 8);
        ctx.lineTo(x + tx + 4, y + ty);
        ctx.lineTo(x + tx + 8, y + ty + 8);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case "T":
      ctx.fillStyle = "#805830";
      ctx.fillRect(x + 12, y + 16, 8, 14);
      ctx.fillStyle = "#306828";
      ctx.beginPath();
      ctx.arc(x + TS / 2, y + 12, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#408838";
      ctx.beginPath();
      ctx.arc(x + TS / 2 - 4, y + 8, 8, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "W":
      ctx.fillStyle = "#4890e0";
      ctx.fillRect(x, y, TS, TS);
      ctx.strokeStyle = "#88c0f0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 12);
      ctx.quadraticCurveTo(x + 10, y + 8, x + 16, y + 12);
      ctx.quadraticCurveTo(x + 22, y + 16, x + 28, y + 12);
      ctx.stroke();
      break;
    case "F":
      ctx.fillStyle = "#a87848";
      ctx.fillRect(x + 4, y + 8, 6, 20);
      ctx.fillRect(x + 22, y + 8, 6, 20);
      ctx.fillRect(x, y + 12, TS, 5);
      break;
    case "h":
      ctx.fillStyle = "#e8d0a8";
      ctx.fillRect(x, y, TS, TS);
      ctx.fillStyle = "#c04838";
      ctx.fillRect(x, y, TS, 12);
      ctx.strokeStyle = "#a08868";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, TS - 2, TS - 2);
      break;
    case "D":
      ctx.fillStyle = "#f8a8c8";
      ctx.fillRect(x + 3, y + 3, TS - 6, TS - 6);
      ctx.strokeStyle = "#e87098";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 5, y + 5, TS - 10, TS - 10);
      break;
    case "S":
      ctx.fillStyle = "#805830";
      ctx.fillRect(x + 14, y + 16, 5, 12);
      ctx.fillStyle = "#c8a060";
      ctx.fillRect(x + 5, y + 6, 22, 12);
      break;
  }
}

// ===== メインループ =====
let lastTime = 0;
function loop(time) {
  const dt = Math.min(50, time - lastTime);
  lastTime = time;
  game.update(dt);
  game.draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
