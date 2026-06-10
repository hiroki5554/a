"use strict";

// ===== タイプ定義 =====
const TYPES = {
  normal:   { name: "ノーマル", color: "#a8a878" },
  fire:     { name: "ほのお",   color: "#f08030" },
  water:    { name: "みず",     color: "#6890f0" },
  grass:    { name: "くさ",     color: "#78c850" },
  electric: { name: "でんき",   color: "#f8d030" },
  rock:     { name: "いわ",     color: "#b8a038" },
};

// 攻撃タイプ → 防御タイプ → 倍率(記載なしは1倍)
const TYPE_CHART = {
  normal:   { rock: 0.5 },
  fire:     { grass: 2, fire: 0.5, water: 0.5, rock: 0.5 },
  water:    { fire: 2, rock: 2, water: 0.5, grass: 0.5 },
  grass:    { water: 2, rock: 2, fire: 0.5, grass: 0.5 },
  electric: { water: 2, grass: 0.5, electric: 0.5, rock: 0.5 },
  rock:     { fire: 2, rock: 0.5 },
};

function typeEffect(atkType, defType) {
  const row = TYPE_CHART[atkType];
  if (row && row[defType] !== undefined) return row[defType];
  return 1;
}

// ===== 技定義 =====
const MOVES = {
  tackle:     { name: "たいあたり",         type: "normal",   power: 35, acc: 100 },
  scratch:    { name: "ひっかき",           type: "normal",   power: 40, acc: 100 },
  charge:     { name: "とっしん",           type: "normal",   power: 60, acc: 90 },
  windcut:    { name: "ウィンドカッター",   type: "normal",   power: 50, acc: 95 },
  ember:      { name: "フレイムショット",   type: "fire",     power: 40, acc: 100 },
  flameburst: { name: "かえんバースト",     type: "fire",     power: 65, acc: 95 },
  aquashot:   { name: "アクアショット",     type: "water",    power: 40, acc: 100 },
  aquabreak:  { name: "アクアブレイク",     type: "water",    power: 65, acc: 95 },
  leafcut:    { name: "リーフカッター",     type: "grass",    power: 40, acc: 100 },
  grassblade: { name: "グラスブレード",     type: "grass",    power: 65, acc: 95 },
  spark:      { name: "スパークショット",   type: "electric", power: 40, acc: 100 },
  voltcrash:  { name: "ボルトクラッシュ",   type: "electric", power: 65, acc: 95 },
  rockroll:   { name: "いわころがし",       type: "rock",     power: 40, acc: 95 },
  rockbreak:  { name: "ロックブレイク",     type: "rock",     power: 65, acc: 90 },
};

// ===== モンスター図鑑(全てオリジナル) =====
const SPECIES = {
  hibanyan: {
    name: "ヒバニャン", type: "fire",
    base: { hp: 45, atk: 52, def: 43, spd: 60 },
    catchRate: 60, baseExp: 24, shape: "beast",
    pal: { main: "#f08030", sub: "#ffd070", accent: "#d03020" },
    learnset: [ { lv: 1, move: "scratch" }, { lv: 3, move: "ember" }, { lv: 7, move: "charge" }, { lv: 12, move: "flameburst" } ],
  },
  aquamo: {
    name: "アクアモ", type: "water",
    base: { hp: 50, atk: 48, def: 50, spd: 45 },
    catchRate: 60, baseExp: 24, shape: "blob",
    pal: { main: "#58a8f0", sub: "#a8d8f8", accent: "#f070a0" },
    learnset: [ { lv: 1, move: "tackle" }, { lv: 3, move: "aquashot" }, { lv: 7, move: "windcut" }, { lv: 12, move: "aquabreak" } ],
  },
  leafin: {
    name: "リーフィン", type: "grass",
    base: { hp: 46, atk: 50, def: 48, spd: 52 },
    catchRate: 60, baseExp: 24, shape: "beast",
    pal: { main: "#78c850", sub: "#c8f0a0", accent: "#408030" },
    learnset: [ { lv: 1, move: "scratch" }, { lv: 3, move: "leafcut" }, { lv: 7, move: "charge" }, { lv: 12, move: "grassblade" } ],
  },
  denrisu: {
    name: "デンリス", type: "electric",
    base: { hp: 38, atk: 45, def: 35, spd: 70 },
    catchRate: 190, baseExp: 16, shape: "beast",
    pal: { main: "#f8d030", sub: "#fff0a0", accent: "#c89010" },
    learnset: [ { lv: 1, move: "tackle" }, { lv: 4, move: "spark" }, { lv: 9, move: "windcut" }, { lv: 13, move: "voltcrash" } ],
  },
  fuwadori: {
    name: "フワドリ", type: "normal",
    base: { hp: 42, atk: 42, def: 38, spd: 62 },
    catchRate: 200, baseExp: 14, shape: "bird",
    pal: { main: "#f8f8f0", sub: "#f0c060", accent: "#6890f0" },
    learnset: [ { lv: 1, move: "tackle" }, { lv: 4, move: "windcut" }, { lv: 10, move: "charge" } ],
  },
  hanapon: {
    name: "ハナポン", type: "grass",
    base: { hp: 48, atk: 40, def: 50, spd: 35 },
    catchRate: 200, baseExp: 15, shape: "flower",
    pal: { main: "#f078a0", sub: "#78c850", accent: "#f8e060" },
    learnset: [ { lv: 1, move: "tackle" }, { lv: 4, move: "leafcut" }, { lv: 11, move: "grassblade" } ],
  },
  birimushi: {
    name: "ビリムシ", type: "electric",
    base: { hp: 35, atk: 40, def: 32, spd: 55 },
    catchRate: 220, baseExp: 12, shape: "bug",
    pal: { main: "#a8e048", sub: "#f8d030", accent: "#303030" },
    learnset: [ { lv: 1, move: "tackle" }, { lv: 3, move: "spark" }, { lv: 10, move: "voltcrash" } ],
  },
  mogutan: {
    name: "モグタン", type: "normal",
    base: { hp: 50, atk: 52, def: 45, spd: 30 },
    catchRate: 190, baseExp: 16, shape: "blob",
    pal: { main: "#a07040", sub: "#d8b080", accent: "#604020" },
    learnset: [ { lv: 1, move: "scratch" }, { lv: 5, move: "rockroll" }, { lv: 11, move: "charge" } ],
  },
  pukuo: {
    name: "プクオ", type: "water",
    base: { hp: 45, atk: 46, def: 42, spd: 48 },
    catchRate: 180, baseExp: 18, shape: "fish",
    pal: { main: "#6890f0", sub: "#f8d030", accent: "#f06868" },
    learnset: [ { lv: 1, move: "tackle" }, { lv: 4, move: "aquashot" }, { lv: 11, move: "aquabreak" } ],
  },
  boruken: {
    name: "ボルケン", type: "fire",
    base: { hp: 44, atk: 55, def: 40, spd: 50 },
    catchRate: 160, baseExp: 20, shape: "turtle",
    pal: { main: "#e05038", sub: "#f8a058", accent: "#802818" },
    learnset: [ { lv: 1, move: "scratch" }, { lv: 5, move: "ember" }, { lv: 12, move: "flameburst" } ],
  },
  gororo: {
    name: "ゴロロ", type: "rock",
    base: { hp: 55, atk: 50, def: 65, spd: 25 },
    catchRate: 140, baseExp: 22, shape: "golem",
    pal: { main: "#b8a038", sub: "#888878", accent: "#505048" },
    learnset: [ { lv: 1, move: "tackle" }, { lv: 5, move: "rockroll" }, { lv: 12, move: "rockbreak" } ],
  },
  iwagon: {
    name: "イワゴン", type: "rock",
    base: { hp: 52, atk: 48, def: 60, spd: 30 },
    catchRate: 150, baseExp: 20, shape: "turtle",
    pal: { main: "#909890", sub: "#b8c0b8", accent: "#585850" },
    learnset: [ { lv: 1, move: "tackle" }, { lv: 5, move: "rockroll" }, { lv: 10, move: "charge" }, { lv: 14, move: "rockbreak" } ],
  },
};

const STARTERS = ["hibanyan", "aquamo", "leafin"];

// ===== 野生モンスター出現テーブル =====
// G = 南の草むら(低レベル)、H = 北の草むら(高レベル)
const ENCOUNTER_TABLES = {
  G: { minLv: 2, maxLv: 4, species: ["denrisu", "fuwadori", "hanapon", "birimushi", "mogutan"] },
  H: { minLv: 4, maxLv: 7, species: ["pukuo", "boruken", "gororo", "iwagon", "denrisu"] },
};
const ENCOUNTER_RATE = 0.15;

// ===== マップ =====
// T=木(進入不可) W=水(進入不可) F=フェンス(進入不可) h=家(進入不可)
// .=道 ,=草地 f=花 G/H=草むら(エンカウント) D=回復マット S=立て札
const MAP_LAYOUT = [
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTT",
  "Thhh.....TTT....,,,,HHHH,,TT",
  "ThDh......,,....,,,,HHHH,,TT",
  "T..........,....,,HHHHHH,,TT",
  "T...S.......,,...,,,,,,,,,TT",
  "T....,,f........FFFF...,,,TT",
  "T,,,..........,........,,.TT",
  "T,,...WWWW....,...,,,,....TT",
  "T,..f.WWWW....,...,,,,...,TT",
  "T..,..WWWW.......,,..f...,TT",
  "T.....WWWW......,....,,,..TT",
  "T,,..f...,,,....,,,......,TT",
  "T..,,..GGGGGG....,,,..,,..TT",
  "T,..,..GGGGGG..,..f.,...,.TT",
  "T...,..GGGGGG..,,...,,,...TT",
  "T,,....GGGGGG......,....f.TT",
  "T......,,,,........,,,...,TT",
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTT",
];

const MAP_W = 28;
const MAP_H = MAP_LAYOUT.length;

function tileAt(x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return "T";
  const row = MAP_LAYOUT[y];
  return x < row.length ? row[x] : "T";
}

const SOLID_TILES = new Set(["T", "W", "F", "h", "S"]);

const SIGN_TEXTS = [
  "「ここは はじまりの村」",
  "「北の草むらは 強いモンスターが出るぞ。",
  "  まずは南の草むらで 鍛えよう!」",
  "「家のピンクのマットに乗ると",
  "  モンスターが回復して ボールも補充されるよ」",
];

// プレイヤー初期位置(回復マットの下あたり)
const START_X = 2;
const START_Y = 4;
const HEAL_POS = { x: 2, y: 2 };

// ===== ステータス計算 =====
function calcMaxHp(base, level) {
  return Math.floor(base.hp * 0.4) + level * 2 + 12;
}
function calcStat(baseVal, level) {
  return Math.floor(baseVal * (level + 15) / 40) + 5;
}
function expToNext(level) {
  return level * level * 4 + 10;
}

// モンスター個体を作る
function makeMonster(speciesId, level) {
  const sp = SPECIES[speciesId];
  const mon = {
    speciesId,
    name: sp.name,
    type: sp.type,
    level,
    exp: 0,
    moves: [],
    maxHp: 0, hp: 0, atk: 0, def: 0, spd: 0,
  };
  recalcStats(mon);
  mon.hp = mon.maxHp;
  // 覚えられる技のうち最新4つ
  const learned = sp.learnset.filter(e => e.lv <= level).map(e => e.move);
  mon.moves = learned.slice(-4);
  return mon;
}

function recalcStats(mon) {
  const sp = SPECIES[mon.speciesId];
  mon.maxHp = calcMaxHp(sp.base, mon.level);
  mon.atk = calcStat(sp.base.atk, mon.level);
  mon.def = calcStat(sp.base.def, mon.level);
  mon.spd = calcStat(sp.base.spd, mon.level);
}

// レベルアップ処理。発生したイベントをメッセージ配列で返す
function gainExp(mon, amount) {
  const msgs = [];
  mon.exp += amount;
  msgs.push(`${mon.name}は ${amount}の経験値を 手に入れた!`);
  while (mon.exp >= expToNext(mon.level)) {
    mon.exp -= expToNext(mon.level);
    mon.level += 1;
    const oldMax = mon.maxHp;
    recalcStats(mon);
    mon.hp = Math.min(mon.maxHp, mon.hp + (mon.maxHp - oldMax));
    msgs.push(`${mon.name}は レベル${mon.level}に 上がった!`);
    const sp = SPECIES[mon.speciesId];
    for (const e of sp.learnset) {
      if (e.lv === mon.level && !mon.moves.includes(e.move)) {
        if (mon.moves.length >= 4) {
          const forgotten = mon.moves.shift();
          msgs.push(`${mon.name}は ${MOVES[forgotten].name}を 忘れて…`);
        }
        mon.moves.push(e.move);
        msgs.push(`${mon.name}は ${MOVES[e.move].name}を 覚えた!`);
      }
    }
  }
  return msgs;
}

// ダメージ計算
function calcDamage(attacker, defender, moveId) {
  const move = MOVES[moveId];
  const eff = typeEffect(move.type, defender.type);
  const stab = SPECIES[attacker.speciesId].type === move.type ? 1.3 : 1;
  const rand = 0.85 + Math.random() * 0.15;
  const baseDmg = ((2 * attacker.level / 5 + 2) * move.power * attacker.atk / defender.def) / 40 + 2;
  const dmg = Math.max(1, Math.floor(baseDmg * eff * stab * rand));
  return { dmg, eff };
}

// 捕獲判定
function catchChance(mon) {
  const sp = SPECIES[mon.speciesId];
  const hpFrac = mon.hp / mon.maxHp;
  return Math.min(0.95, (1 - 0.7 * hpFrac) * (sp.catchRate / 255) * 1.6);
}
