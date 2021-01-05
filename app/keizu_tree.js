//
// 男子継承シミュレーター (C)Github/fujas 2020
//
// 天皇を男子で継承するときの系図を、指定の条件でシミュレーションして作図します。
// 系図の起点は「未来の架空の天皇」であり、その天皇まで同じ条件で継承されたものと仮定します。
//

// ********** シード付き乱数 **********

// xorshift128+ 
// Copyright (c) 2014 Andreas Madsen & Emil Bay
/**
 * Create a pseudorandom number generator, with a seed.
 * @param {array} seed "128-bit" integer, composed of 4x32-bit
 * integers in big endian order.
 */
function XorShift(seed) {
  // Note the extension, this === module.exports is required because
  // the `constructor` function will be used to generate new instances.
  // In that case `this` will point to the default RNG, and `this` will
  // be an instance of XorShift.
  if (!(this instanceof XorShift) /*|| this === module.exports*/) {
    return new XorShift(seed);
  }

  if (!Array.isArray(seed) || seed.length !== 4) {
    throw new TypeError('seed must be an array with 4 numbers');
  }

  // uint64_t s = [seed ...]
  this._state0U = seed[0] | 0;
  this._state0L = seed[1] | 0;
  this._state1U = seed[2] | 0;
  this._state1L = seed[3] | 0;
}

/**
 * Returns a 64bit random number as a 2x32bit array
 * @return {array}
 */
XorShift.prototype.randomint = function() {
  // uint64_t s1 = s[0]
  var s1U = this._state0U, s1L = this._state0L;
  // uint64_t s0 = s[1]
  var s0U = this._state1U, s0L = this._state1L;

  // result = s0 + s1
  var sumL = (s0L >>> 0) + (s1L >>> 0);
  resU = (s0U + s1U + (sumL / 2 >>> 31)) >>> 0;
  resL = sumL >>> 0;

  // s[0] = s0
  this._state0U = s0U;
  this._state0L = s0L;

  // - t1 = [0, 0]
  var t1U = 0, t1L = 0;
  // - t2 = [0, 0]
  var t2U = 0, t2L = 0;

  // s1 ^= s1 << 23;
  // :: t1 = s1 << 23
  var a1 = 23;
  var m1 = 0xFFFFFFFF << (32 - a1);
  t1U = (s1U << a1) | ((s1L & m1) >>> (32 - a1));
  t1L = s1L << a1;
  // :: s1 = s1 ^ t1
  s1U = s1U ^ t1U;
  s1L = s1L ^ t1L;

  // t1 = ( s1 ^ s0 ^ ( s1 >> 17 ) ^ ( s0 >> 26 ) )
  // :: t1 = s1 ^ s0
  t1U = s1U ^ s0U;
  t1L = s1L ^ s0L;
  // :: t2 = s1 >> 18
  var a2 = 18;
  var m2 = 0xFFFFFFFF >>> (32 - a2);
  t2U = s1U >>> a2;
  t2L = (s1L >>> a2) | ((s1U & m2) << (32 - a2));
  // :: t1 = t1 ^ t2
  t1U = t1U ^ t2U;
  t1L = t1L ^ t2L;
  // :: t2 = s0 >> 5
  var a3 = 5;
  var m3 = 0xFFFFFFFF >>> (32 - a3);
  t2U = s0U >>> a3;
  t2L = (s0L >>> a3) | ((s0U & m3) << (32 - a3));
  // :: t1 = t1 ^ t2
  t1U = t1U ^ t2U;
  t1L = t1L ^ t2L;

  // s[1] = t1
  this._state1U = t1U;
  this._state1L = t1L;

  // return result
  return [resU, resL];
};

/**
 * Returns a random number normalized [0, 1), just like Math.random()
 * @return {number}
 */
XorShift.prototype.random = function() {
  var t2 = this.randomint();
  // Math.pow(2, -32) = 2.3283064365386963e-10
  // Math.pow(2, -52) = 2.220446049250313e-16
  var rnd = t2[0] * 2.3283064365386963e-10 + (t2[1] >>> 12) * 2.220446049250313e-16;
  return rnd;
};
// xorshift128+

let g_myRnd;

function resetRnd(seed){
  // パターンIDを乱数シードにする
  g_myRnd = new XorShift([seed + 12345, seed * 2 + 101, seed * 3 + 12345, seed + 5678]);
  // 初期の乱数は偏りが大きいので何回か乱数生成
  for (let i = 0; i < 5; i++){
    g_myRnd.randomint();
  }
}

// ********** 構造体 ***********
// 生成情報パラメーター
function TreeStat(){
  this.success = true;      // 指定世代まで継承できたらtrue
  this.maxAnc = 1;          // 最も遡った世代数
  this.numNoAnc = 0;        // 子に継承できた回数
}

// 統計計算保持用パラメーター
function StatisticsParams(){
  this.numSuccess = 0;
  this.maxAnc = 0;
  this.maxAncs = [];
  this.noAnc = 0;
  this.currIndex = 0;
  this.updateProgress = false;
  for (let i = 0; i < g_Params.ancLimit; i++){
    this.maxAncs[i] = 0;
  }
}
let g_Statistics;
let g_Params;

// ********** 数値制御関数 **********

// 新規人物のIDを割り振る関数
let g_ID = 0;
function resetNewID() {
  g_ID = 0;
}
function getNewID() {
  g_ID++;
  return g_ID;
}

// 性別決定関数
function defineMale() {
  let retVal = (g_Params.maleRatio > g_myRnd.random() * 100.0) ? true : false;
  return retVal;
}

// 子供の数の決定関数
function defineNumChild() {
  // 小数点も考慮。2.5なら2人か3人。
  let numInt = Math.floor(g_Params.numChild);
  let numDecimal = g_Params.numChild - numInt;
  numInt = (numDecimal > g_myRnd.random()) ? numInt + 1 : numInt;
  return numInt;
}

// ********** 人物クラス **********
// 表示枝刈用フラグ
const EmperorKind = {
  Normal: 0,       // 天皇ではない人
  EmperorParent: 1,   // 天皇ではないがその先祖の男
  Emperor: 2          // 天皇
}
// 人物クラス
let Person = (function () {

  // コンストラクタ
  let Person = function (parent, id, generation, male) {
    if (!(this instanceof Person)) {
      return new Person();
    }
    // メンバ変数
    this.id = id;                   // 表示制御用ID
    this.generation = generation;   // 世代。起点以前なら負の数になる。
    this.male = male;               // 性別(trueで男)
    this.emperor = EmperorKind.Normal;    // 表示用の、天皇かどうかのフラグ
    // メンバ変数（リンク）
    this.parent = parent;           // 父親へのポインタ
    this.child = [];                // 子供へのポインタ配列
    // メンバ変数（内部フラグ）
    this.childCreated = false;      // 子供を全部作ったらtrue
    this.noFamily = false;          // 男系子孫が途絶えることが確定したらtrue
  }
  let p = Person.prototype;

  // Getter
  p.getParent = function () { return this.parent; }

  // Setter
  p.setEmperor = function (kind) { this.emperor = kind; }
  p.setNoFamily = function () { this.noFamily = true; }

  // 子供生成関数
  p.createChildren = function () {
    if (this.male && this.childCreated == false) {
      let currChild = this.child.length;  // 既に存在する子供の数
      let numChild = defineNumChild();    // 生まれるべき全部の子供の数
      let gene = this.generation + 1;     // １世代あとに設定
      // 子供生成ループ。currChild >= numChild なら何もしない。
      for (let i = currChild; i < numChild; i++) {
        // 子供を生成。性別は確率で決まる
        this.child[i] = new Person(this, getNewID(), gene, defineMale());
      }
      this.childCreated = true;
    }
  }

  // 親生成関数
  p.createParent = function () {
    let gene = this.generation - 1;
    let parent = new Person(null, getNewID(), gene, true); // １世代前の男として生成
    parent.child[0] = this;     // 自分を子供に設定
    this.parent = parent;       // 自分の親を設定
    parent.createChildren();    // 自分の兄弟姉妹を生成
    return parent;
  }

  // 世継ぎ取得関数
  p.getPrince = function () {
    // 子供を作っていなければ生成
    this.createChildren();
    // 子供に男がいればそれを返す
    for (let child of this.child) {
      // 男系子孫が途絶えていない男だけを探す
      if (child.male && (!child.noFamily)) {
        return child;
      }
    }
    // 男がいなければnull
    return null;
  }

  return Person;
})();

// ********** １世代先の世継ぎを生成する関数群 **********

// 天皇の先祖にフラグを付ける
function setFlagToEmperorParents(emperor) {
  // emperorが天皇であるかチェック。
  if (emperor.emperor != EmperorKind.Emperor) {
    return;
  }

  let parent = emperor;
  while (1) {
    // 親がいない、またはすでに天皇か天皇の祖先なら処理終了。
    parent = parent.getParent();
    if (parent == null || parent.emperor != EmperorKind.Normal) {
      return;
    }
    // 天皇の先祖フラグを付ける。
    parent.emperor = EmperorKind.EmperorParent;
  }
}

// 生成した最も前の世代の人物を返す
function findRoot(person) {
  let rootParent = person;
  while (rootParent.getParent() != null) {
    rootParent = rootParent.getParent();
  }
  return rootParent;
}

// 子孫が途絶えているか不明な親までさかのぼる（必要なら親を生成）
function backTrackPrince(person, targetGeneration, stat) {
  let parent = person;
  do {
    // 最高遡り数を統計情報に記録
    let ancSize = targetGeneration - parent.generation;
    stat.maxAnc = (ancSize + 1 > stat.maxAnc) ? ancSize + 1 : stat.maxAnc;
    // 遡る限度に達していたらnullを返す
   // if (parent.generation <= targetGeneration - g_Params.ancLimit){
      if (ancSize >= g_Params.ancLimit){
        return null;
    }
    // 1世代遡る
    let prev = parent;
    parent = parent.parent;
    if (parent == null) {
      // 親が未定義なら生成
      parent = prev.createParent();
      // 親が天皇やその祖先であれば天皇の祖先フラグを付ける
      if (prev.emperor != EmperorKind.Normal) {
        parent.setEmperor(EmperorKind.EmperorParent);
      }
    }
  } while (parent.noFamily == true);  // 子孫が途絶えている親ならさらに遡る

  return parent;
}

// 1世代先の世継ぎを作る
function forwardTrackPrince(person, stat) {

  let prince = null;
  let parent = person;
  let targetGeneration = person.generation + 1;
  do {
    // 子孫が途絶えていない男子を探す
    parent.createChildren();
    prince = parent.getPrince();

    // 男子がいないとき
    if (prince == null) {
      parent.setNoFamily(); // 断絶フラグを設定
      // 親をさかのぼった男子を取得
      prince = backTrackPrince(parent, targetGeneration, stat);
    }
    // 先祖が遠すぎて断念したときはnullを返す
    if (prince == null) {
      return null;
    }

    // 規定の世代まで王子を生成
    parent = prince;
  } while (prince.generation < targetGeneration);

  return prince;
}

// 系図を作成
function createTree(stat) {
  // 始祖を生成
  resetNewID();
  let origin = new Person(null, getNewID(), 1, true);
  origin.setEmperor(EmperorKind.Emperor);

  // １代ずつ子孫を生成（1度のforward呼び出しでもできそうだが、処理を簡潔にするため分ける）
  let person = origin;
  for (let i = 0; i < g_Params.generation - 1; i++) {
    let prince = forwardTrackPrince(person, stat);
    if (prince == null) {
      stat.success = false;
      break;
    }
    if (prince.getParent() == person){
      stat.numNoAnc++;  // 親から継承できたときの統計情報
    }
    prince.setEmperor(EmperorKind.Emperor);  // 天皇フラグを設定
    setFlagToEmperorParents(prince);   // 天皇の先祖にフラグを設定
    person = prince;
  }
  return origin;
}

// ********** 統計情報を計算 **********

// 統計を取る
function calcStatistics(){
  // パターン数だけツリーを生成
  let percentNum = g_Params.numPattern / 100;
  for (let i = 0; i < g_Params.numPattern; i++){
    // 乱数をiのseedで初期化
    resetRnd(i);
    // ツリーを生成
    let stat = new TreeStat();
    let origin = createTree(stat);
    // 成功時は統計情報を取得
    if (stat.success){
      g_Statistics.numSuccess++;
      g_Statistics.maxAnc += stat.maxAnc;
      g_Statistics.maxAncs[stat.maxAnc - 1]++;
      g_Statistics.noAnc += stat.numNoAnc;
    }
    // １％ごとに進捗情報をメインスレッドにポスト
    if (i % percentNum == 0){
      let percent = i / percentNum;
      if (percent >= 1 && percent <= 99){
        let retVal = { type: percent };
        self.postMessage(retVal);
      }
    }
  }
  // 統計情報を整理
  let successRat = 100.0 * g_Statistics.numSuccess / g_Params.numPattern;
  if (g_Statistics.numSuccess > 0){
    g_Statistics.maxAnc = g_Statistics.maxAnc / g_Statistics.numSuccess;
    g_Statistics.noAnc = 100.0 * (g_Statistics.noAnc / g_Statistics.numSuccess) / (g_Params.generation - 1);
    for (let i = 0; i < g_Params.ancLimit; i++){
      g_Statistics.maxAncs[i] = 100.0 * g_Statistics.maxAncs[i] / g_Statistics.numSuccess;
      g_Statistics.maxAncs[i] = g_Statistics.maxAncs[i].toFixed(1);
    }
  }
  // 統計結果を返す
  let statStat = { ratio: successRat, max: g_Statistics.maxAnc, maxs: g_Statistics.maxAncs, child: g_Statistics.noAnc };
  return statStat;
}

// ********** イベント処理 **********

// workerスレッドメイン
self.addEventListener('message', function(params) {

  g_Params = params.data;
  let stat = new TreeStat();

  // ツリーを1個生成
  resetRnd(g_Params.pattern);
  let origin = createTree(stat);
  let rootParent = findRoot(origin);
  //処理結果を送信
  let treeInfo = { root: rootParent, stat: stat };
  let retVal = { type: 0, tree:treeInfo };
  self.postMessage(retVal);

  // 続けて統計処理
  g_Statistics = new StatisticsParams();
  // 統計情報の計算
  let statStat = calcStatistics();
  // 結果を送信
  let retVal2 = { type: 100, statstat:statStat };
  self.postMessage(retVal2);
  
}, false);
