"use strict";
// バトルロジックの自動テスト(Node.jsで実行)
// 使い方: node test/battle-sim.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const code =
  fs.readFileSync(path.join(root, "js/data.js"), "utf8") + "\n" +
  fs.readFileSync(path.join(root, "js/battle.js"), "utf8");

const sandbox = { Math, JSON, console };
vm.createContext(sandbox);
// const/class 宣言はサンドボックスに自動で付かないため、明示的にエクスポートする
vm.runInContext(
  code + "\n;({ makeMonster, Battle, SPECIES, expToNext, gainExp });",
  sandbox
);
const exported = vm.runInContext(
  "({ makeMonster, Battle, SPECIES, expToNext, gainExp })", sandbox
);
const { makeMonster, Battle, SPECIES, expToNext } = exported;
sandbox.gainExp = exported.gainExp;

let failures = 0;
function check(cond, label) {
  if (!cond) { failures += 1; console.error("NG:", label); }
}

// 1. 全モンスターが正しく生成できるか
for (const id of Object.keys(SPECIES)) {
  for (const lv of [1, 5, 10, 20]) {
    const m = makeMonster(id, lv);
    check(m.maxHp > 0 && m.hp === m.maxHp, `${id} Lv${lv} HP`);
    check(m.moves.length >= 1 && m.moves.length <= 4, `${id} Lv${lv} 技の数`);
    check(m.atk > 0 && m.def > 0 && m.spd > 0, `${id} Lv${lv} ステータス`);
  }
}

// 2. レベルアップで経験値・技習得が壊れないか
{
  const m = makeMonster("hibanyan", 5);
  for (let i = 0; i < 50; i++) sandbox.gainExp(m, expToNext(m.level));
  check(m.level > 5, "レベルアップする");
  check(m.moves.length <= 4, "技が4つを超えない");
}

// 3. バトルをランダム入力で大量にシミュレートし、例外なく終了するか
const BUTTONS = ["up", "down", "left", "right", "A", "B"];
let results = { win: 0, lose: 0, catch: 0, run: 0 };
for (let trial = 0; trial < 500; trial++) {
  const game = {
    party: [makeMonster("hibanyan", 5), makeMonster("aquamo", 4)],
    balls: 10,
  };
  const wild = makeMonster("denrisu", 3);
  const battle = new Battle(game, wild);
  let steps = 0;
  while (!battle.done && steps < 3000) {
    const btn = Math.random() < 0.5 ? "A" : BUTTONS[Math.floor(Math.random() * BUTTONS.length)];
    battle.handleInput(btn);
    steps += 1;
  }
  check(battle.done, `バトル${trial}が終了する(${steps}手)`);
  if (battle.result) results[battle.result] += 1;
  if (battle.result === "catch") {
    check(game.party.length === 3, "捕獲でパーティが増える");
  }
  for (const m of game.party) {
    check(m.hp >= 0 && m.hp <= m.maxHp, "HPが範囲内");
  }
}
console.log("バトル結果の内訳:", results);
check(results.win > 0, "勝利が発生する");
check(results.catch > 0, "捕獲が発生する");
check(results.run > 0, "逃走が発生する");

if (failures === 0) {
  console.log("OK: すべてのテストに合格しました");
} else {
  console.error(`失敗: ${failures}件`);
  process.exit(1);
}
