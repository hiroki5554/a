"use strict";

// ターン制バトル。queue に {text} / {fn} / {interact} を積んで順に処理する。
class Battle {
  constructor(game, wild) {
    this.game = game;
    this.enemy = wild;
    this.activeIdx = game.party.findIndex(m => m.hp > 0);
    this.queue = [];
    this.state = "msg";        // msg | menu | moves | party | done
    this.menuIdx = 0;
    this.moveIdx = 0;
    this.partyIdx = 0;
    this.forcedSwitch = false;
    this.done = false;
    this.result = null;        // win | lose | catch | run

    this.push(
      { text: `あ! 野生の ${wild.name}が とびだしてきた!` },
      { text: `いけ! ${this.active.name}!` },
    );
    this.step();
  }

  get active() { return this.game.party[this.activeIdx]; }

  push(...items) { this.queue.push(...items); }
  pushFront(items) { this.queue.unshift(...items); }

  finish(result) {
    this.queue = [];
    this.done = true;
    this.state = "done";
    this.result = result;
  }

  // queue の先頭を処理して、次の入力待ち状態を決める
  step() {
    while (true) {
      if (this.done) return;
      if (this.queue.length === 0) {
        this.state = "menu";
        this.menuIdx = 0;
        return;
      }
      const head = this.queue[0];
      if (head.fn) {
        this.queue.shift();
        head.fn();
        continue;
      }
      if (head.interact) {
        this.queue.shift();
        this.state = head.interact;
        this.forcedSwitch = !!head.forced;
        this.partyIdx = 0;
        return;
      }
      this.state = "msg";
      return;
    }
  }

  // ===== 入力処理 =====
  handleInput(btn) {
    if (this.done) return;
    switch (this.state) {
      case "msg":
        if (btn === "A") { this.queue.shift(); this.step(); }
        break;
      case "menu": this.menuInput(btn); break;
      case "moves": this.movesInput(btn); break;
      case "party": this.partyInput(btn); break;
    }
  }

  menuInput(btn) {
    if (btn === "left" && this.menuIdx % 2 === 1) this.menuIdx -= 1;
    if (btn === "right" && this.menuIdx % 2 === 0) this.menuIdx += 1;
    if (btn === "up" && this.menuIdx >= 2) this.menuIdx -= 2;
    if (btn === "down" && this.menuIdx < 2) this.menuIdx += 2;
    if (btn !== "A") return;
    switch (this.menuIdx) {
      case 0: this.state = "moves"; this.moveIdx = 0; break;
      case 1: this.throwBall(); break;
      case 2: this.state = "party"; this.partyIdx = 0; this.forcedSwitch = false; break;
      case 3: this.tryRun(); break;
    }
  }

  movesInput(btn) {
    const n = this.active.moves.length;
    if (btn === "up") this.moveIdx = (this.moveIdx + n - 1) % n;
    if (btn === "down") this.moveIdx = (this.moveIdx + 1) % n;
    if (btn === "B") { this.state = "menu"; return; }
    if (btn === "A") this.chooseMove(this.active.moves[this.moveIdx]);
  }

  partyInput(btn) {
    const n = this.game.party.length;
    if (btn === "up") this.partyIdx = (this.partyIdx + n - 1) % n;
    if (btn === "down") this.partyIdx = (this.partyIdx + 1) % n;
    if (btn === "B" && !this.forcedSwitch) { this.state = "menu"; return; }
    if (btn !== "A") return;
    const target = this.game.party[this.partyIdx];
    if (target.hp <= 0) return;                      // 瀕死は選べない
    if (this.partyIdx === this.activeIdx && !this.forcedSwitch) return;
    this.switchTo(this.partyIdx, this.forcedSwitch);
  }

  // ===== 行動 =====
  chooseMove(moveId) {
    const p = this.active, e = this.enemy;
    const enemyMove = e.moves[Math.floor(Math.random() * e.moves.length)];
    const pFirst = p.spd >= e.spd;
    const first = pFirst ? ["p", moveId] : ["e", enemyMove];
    const second = pFirst ? ["e", enemyMove] : ["p", moveId];
    this.queueAttack(first);
    this.push({ fn: () => {
      if (!this.done && this.active.hp > 0 && this.enemy.hp > 0) this.queueAttack(second);
    } });
    this.step();
  }

  queueAttack([side, moveId]) {
    const att = side === "p" ? this.active : this.enemy;
    this.push({ text: `${att.name}の ${MOVES[moveId].name}!` });
    this.push({ fn: () => this.resolveAttack(side, moveId) });
  }

  resolveAttack(side, moveId) {
    const att = side === "p" ? this.active : this.enemy;
    const def = side === "p" ? this.enemy : this.active;
    const res = [];
    if (Math.random() * 100 >= MOVES[moveId].acc) {
      res.push({ text: "しかし 攻撃は はずれた!" });
    } else {
      const { dmg, eff } = calcDamage(att, def, moveId);
      def.hp = Math.max(0, def.hp - dmg);
      if (eff > 1) res.push({ text: "効果は バツグンだ!" });
      if (eff < 1) res.push({ text: "効果は いまひとつのようだ…" });
      if (def.hp <= 0) res.push(...this.faintItems(side === "p" ? "e" : "p"));
    }
    this.pushFront(res);
  }

  faintItems(faintedSide) {
    const items = [];
    if (faintedSide === "e") {
      const e = this.enemy;
      items.push({ text: `野生の ${e.name}は たおれた!` });
      const gain = Math.floor(SPECIES[e.speciesId].baseExp * e.level / 4) + 1;
      items.push({ fn: () => {
        const msgs = gainExp(this.active, gain).map(t => ({ text: t }));
        msgs.push({ fn: () => this.finish("win") });
        this.pushFront(msgs);
      } });
    } else {
      items.push({ text: `${this.active.name}は たおれた!` });
      if (this.game.party.some(m => m.hp > 0)) {
        items.push({ text: "次の モンスターを 選ぼう!" });
        items.push({ interact: "party", forced: true });
      } else {
        items.push({ text: "目の前が 真っ暗になった…" });
        items.push({ fn: () => this.finish("lose") });
      }
    }
    return items;
  }

  enemyFreeAttack() {
    if (this.done || this.enemy.hp <= 0 || this.active.hp <= 0) return;
    const m = this.enemy.moves[Math.floor(Math.random() * this.enemy.moves.length)];
    this.queueAttack(["e", m]);
  }

  throwBall() {
    if (this.game.balls <= 0) {
      this.push({ text: "キャプチャボールが ない!" });
      this.step();
      return;
    }
    if (this.game.party.length >= 6) {
      this.push({ text: "手持ちが いっぱいで ボールが使えない!" });
      this.step();
      return;
    }
    this.game.balls -= 1;
    this.push({ text: "キャプチャボールを 投げた!" });
    this.push({ fn: () => {
      if (Math.random() < catchChance(this.enemy)) {
        this.pushFront([
          { text: `やったー! ${this.enemy.name}を 捕まえた!` },
          { fn: () => {
            this.game.party.push(this.enemy);
            this.finish("catch");
          } },
        ]);
      } else {
        this.pushFront([{ text: "ああ! 出てきてしまった!" }]);
        this.push({ fn: () => this.enemyFreeAttack() });
      }
    } });
    this.step();
  }

  tryRun() {
    const p = Math.max(0.25, Math.min(0.95, 0.55 + (this.active.spd - this.enemy.spd) * 0.02));
    this.push({ fn: () => {
      if (Math.random() < p) {
        this.pushFront([
          { text: "うまく 逃げ切れた!" },
          { fn: () => this.finish("run") },
        ]);
      } else {
        this.pushFront([{ text: "逃げられなかった!" }]);
        this.push({ fn: () => this.enemyFreeAttack() });
      }
    } });
    this.step();
  }

  switchTo(idx, forced) {
    const items = [];
    if (!forced) items.push({ text: `戻れ! ${this.active.name}!` });
    items.push({ fn: () => { this.activeIdx = idx; } });
    items.push({ text: `いけ! ${this.game.party[idx].name}!` });
    if (!forced) items.push({ fn: () => this.enemyFreeAttack() });
    this.push(...items);
    this.state = "msg";
    this.step();
  }

  // ===== 描画 =====
  draw(ctx, w, h) {
    // 背景
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#a8d8f0");
    sky.addColorStop(0.6, "#d8f0c8");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    const boxH = 150;
    const fieldH = h - boxH;

    // 足場
    ctx.fillStyle = "rgba(120,160,90,0.7)";
    ctx.beginPath();
    ctx.ellipse(w * 0.72, fieldH * 0.62, 150, 36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w * 0.25, fieldH * 1.02, 180, 42, 0, 0, Math.PI * 2);
    ctx.fill();

    // モンスター
    if (this.enemy.hp > 0 || this.state === "msg") {
      drawMonster(ctx, this.enemy.speciesId, w * 0.72 - 80, fieldH * 0.62 - 150, 160, false);
    }
    if (this.active && this.active.hp > 0) {
      drawMonster(ctx, this.active.speciesId, w * 0.25 - 100, fieldH * 1.02 - 195, 200, true);
    }

    // 敵情報
    this.drawInfoBox(ctx, 24, 24, 300, this.enemy, false);
    // 自分情報
    this.drawInfoBox(ctx, w - 340, fieldH - 120, 316, this.active, true);

    // テキストボックス
    drawBox(ctx, 8, h - boxH, w - 16, boxH - 8);

    if (this.state === "msg" && this.queue.length && this.queue[0].text) {
      drawText(ctx, this.queue[0].text, 36, h - boxH + 52, 26, "#fff");
      drawText(ctx, "▼", w - 60, h - 40, 22, "#fff");
    } else if (this.state === "menu") {
      drawText(ctx, `${this.enemy.name}を どうする?`, 36, h - boxH + 52, 24, "#fff");
      const opts = ["たたかう", `ボール ×${this.game.balls}`, "モンスター", "にげる"];
      const ox = w / 2 + 20, oy = h - boxH + 26;
      drawBox(ctx, ox - 16, h - boxH + 6, w - ox - 4, boxH - 22);
      for (let i = 0; i < 4; i++) {
        const x = ox + (i % 2) * 200, y = oy + Math.floor(i / 2) * 56 + 18;
        drawText(ctx, (this.menuIdx === i ? "▶ " : "   ") + opts[i], x, y, 24, "#fff");
      }
    } else if (this.state === "moves") {
      const m = this.active;
      for (let i = 0; i < m.moves.length; i++) {
        const mv = MOVES[m.moves[i]];
        const y = h - boxH + 36 + i * 30;
        drawText(ctx, (this.moveIdx === i ? "▶ " : "   ") + mv.name, 36, y, 22, "#fff");
        drawTypeTag(ctx, mv.type, 360, y - 18);
        drawText(ctx, `威力${mv.power}`, 460, y, 18, "#ccc");
      }
      drawText(ctx, "Xで もどる", w - 180, h - 24, 16, "#aaa");
    } else if (this.state === "party") {
      drawBox(ctx, w / 2 - 260, 40, 520, 70 + this.game.party.length * 50);
      drawText(ctx, this.forcedSwitch ? "次に 出すモンスターは?" : "交代する モンスターは?", w / 2 - 230, 84, 22, "#fff");
      for (let i = 0; i < this.game.party.length; i++) {
        const mon = this.game.party[i];
        const y = 124 + i * 50;
        const label = (this.partyIdx === i ? "▶ " : "   ") + mon.name +
          (i === this.activeIdx ? " (戦闘中)" : "");
        const color = mon.hp <= 0 ? "#888" : "#fff";
        drawText(ctx, label, w / 2 - 230, y, 22, color);
        drawText(ctx, `Lv${mon.level}  HP ${mon.hp}/${mon.maxHp}`, w / 2 + 30, y, 20, color);
      }
      if (!this.forcedSwitch) drawText(ctx, "Xで もどる", w / 2 + 120, 70 + this.game.party.length * 50 + 28, 16, "#aaa");
    }
  }

  drawInfoBox(ctx, x, y, w, mon, mine) {
    if (!mon) return;
    drawBox(ctx, x, y, w, mine ? 104 : 84);
    drawText(ctx, mon.name, x + 16, y + 32, 22, "#fff");
    drawText(ctx, `Lv${mon.level}`, x + w - 80, y + 32, 22, "#fff");
    drawHpBar(ctx, x + 16, y + 46, w - 32, 14, mon.hp / mon.maxHp);
    if (mine) {
      drawText(ctx, `${mon.hp} / ${mon.maxHp}`, x + 16, y + 86, 18, "#fff");
      // 経験値バー
      const frac = Math.min(1, mon.exp / expToNext(mon.level));
      ctx.fillStyle = "#335";
      ctx.fillRect(x + 130, y + 74, w - 146, 8);
      ctx.fillStyle = "#58c8f8";
      ctx.fillRect(x + 130, y + 74, (w - 146) * frac, 8);
      drawText(ctx, "EXP", x + 130, y + 96, 14, "#9cf");
    }
  }
}

// ===== 共通描画ヘルパー =====
function drawBox(ctx, x, y, w, h) {
  ctx.fillStyle = "rgba(20,30,60,0.92)";
  ctx.strokeStyle = "#e8e8f8";
  ctx.lineWidth = 3;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
  }
}

function drawText(ctx, text, x, y, size, color) {
  ctx.fillStyle = color || "#fff";
  ctx.font = `bold ${size}px "Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, sans-serif`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x, y);
}

function drawHpBar(ctx, x, y, w, h, frac) {
  frac = Math.max(0, Math.min(1, frac));
  ctx.fillStyle = "#223";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = frac > 0.5 ? "#48d048" : frac > 0.2 ? "#f0c030" : "#e04040";
  ctx.fillRect(x + 2, y + 2, (w - 4) * frac, h - 4);
}

function drawTypeTag(ctx, type, x, y) {
  const t = TYPES[type];
  ctx.fillStyle = t.color;
  ctx.fillRect(x, y, 84, 24);
  drawText(ctx, t.name, x + 8, y + 19, 16, "#fff");
}
