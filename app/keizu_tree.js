//
// 男子継承シミュレーター (C)Github/fujas 2021
//
// 天皇を男子で継承するときの系図を、指定の条件でシミュレーションして作図します。
//

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
  for (let i = 0; i < g_Params.generation; i++){
    this.maxAncs[i] = 0;
  }
}
let g_Statistics;
let g_Params;

// ********** シード付き乱数 **********
// "JavaScriptで再現性のある乱数を生成する + 指定した範囲の乱数を生成する" を参考にさせていただきました。
let Random = (function () {
  // コンストラクタ
  let Random = function (seed) {
    if (!(this instanceof Random)) {
      return new Random();
    }
    this.x = 123456789;
    this.y = 362436069;
    this.z = 521288629;
    this.w = seed;
  }
  let r = Random.prototype;

  // XorShiftで0-1の乱数発生
  r.get = function () {
    let t = this.x ^ (this.x << 11);
    this.x = this.y; this.y = this.z; this.z = this.w;
    this.w = (this.w ^ (this.w >>> 19)) ^ (t ^ (t >>> 8));
    const limit = 10000;
    let random = (Math.abs(this.w) % limit) / limit;
    return random;
    //return Math.random(); // 乱数性能確認用コード
  }

  return Random;
})();
let g_myRnd;

function resetRnd(seed){
  // パターンIDを乱数シードにする
  g_myRnd = new Random(seed);
  // シード設定直後は偏りが多いので何回か乱数生成
  for(let i = 0; i < 10; i++){
    g_myRnd.get();
  }
}

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
  let retVal = (g_Params.maleRatio > g_myRnd.get() * 100) ? true : false;
  return retVal;
}

// 子供の数の決定関数
function defineNumChild() {
  // 小数点も考慮。2.5なら2人か3人。
  let numInt = Math.floor(g_Params.numChild);
  let numDecimal = g_Params.numChild - numInt;
  numInt = (numDecimal > g_myRnd.get()) ? numInt + 1 : numInt;
  return numInt;
}

// ********** 人物クラス **********
// 表示枝刈用フラグ
const EmperorKind = {
  Normal: 0,       // 天皇ではない人
  EmperorParent: 1,   // 天皇ではないがその先祖の男子
  Emperor: 2          // 天皇
}
// 人物クラス
let Person = (function () {

  // コンストラクタ
  let Person = function (parent, id, generation, numAnc, male) {
    if (!(this instanceof Person)) {
      return new Person();
    }
    // メンバ変数
    this.id = id;                   // 表示制御用ID
    this.generation = generation;   // 世代
    this.male = male;               // 性別(trueで男)
    this.emperor = EmperorKind.Normal;    // 表示用の、天皇かどうかのフラグ
    this.numAnc = numAnc;           // 天皇またはその先祖までの世代数
    // メンバ変数（リンク）
    this.parent = parent;           // 父親へのポインタ
    this.child = [];                // 子供へのポインタ配列
  }
  let p = Person.prototype;

  // Getter
  p.getParent = function () { return this.parent; }
  p.getChilds = function () { return this.child; }
  p.getEmperor = function () { return this.emperor; }
  p.getAnc = function () { return this.numAnc; }
  // Setter
  p.setEmperor = function (kind) { this.emperor = kind; }
  p.setAnc = function (anc) { this.numAnc = anc; }

  // 子供生成関数
  p.createChildren = function () {
    let currChild = this.child.length;  // 既に存在する子供の数
    let numChild = defineNumChild();    // 生まれるべき全部の子供の数
    let gene = this.generation + 1;     // １世代あとに設定
    let anc = this.numAnc + 1;          // 天皇まで1世代追加
    // 子供生成ループ。currChild >= numChild なら何もしない。
    for (let i = currChild; i < numChild; i++) {
      // 子供を生成。性別は確率で決まる
      this.child[i] = new Person(this, getNewID(), gene, anc, defineMale());
    }
  }

  return Person;
})();

// ********** １世代先の世継ぎを生成する関数群 **********

// 各皇族の天皇までの遡り数を計算
function recalcAncToPerson(person) {
  let parent = person;
  let numAnc = 1;
  while (1) {
    // 親がいない、またはすでに天皇か天皇の祖先なら処理終了。
    parent = parent.getParent();
    if (parent == null || parent.emperor != EmperorKind.Normal) {
      break;
    }
    numAnc++;
  }
  person.setAnc(numAnc);
}
function recalcAncToNexts(nexts) {
  for (let person of nexts){
    if (person != null && person.emperor != EmperorKind.Emperor){
      recalcAncToPerson(person);
    }
  }
}

// 天皇の先祖にフラグを付ける
function setFlagToEmperorParents(emperor, stat) {
  // emperorが天皇であるかチェック。
  if (emperor.emperor != EmperorKind.Emperor) {
    return;
  }

  let parent = emperor;
  let numAnc = 1;
  while (1) {
    // 親がいない、またはすでに天皇か天皇の祖先なら処理終了。
    parent = parent.getParent();
    if (parent == null || parent.emperor != EmperorKind.Normal) {
      break;
    }
    // 天皇の先祖フラグを付ける。
    parent.emperor = EmperorKind.EmperorParent;
    numAnc++;
  }

  if (stat.maxAnc < numAnc){
    stat.maxAnc = numAnc;
  }
}

// 次世代の皇族を生成
function createNextGeneration(prevs, nexts, stat){
  nexts.length = 0;
  let nextInd = 0;
  // 皇族内の各男子において
  for (let prev of prevs){
    if (prev != null){
      // 男子がが近縁なら
      if (prev.getAnc() < g_Params.maxAnc){
        // 子供を生成
        prev.createChildren();
        // 各子供について
        for (let child of prev.getChilds()){
          // 次世代の皇族枠がいっぱいなら何もしない
          if (nextInd >= g_Params.numFamilyMax){
            break;
          }
          // その子供が男子なら次世代皇族に追加
          if (child.male){
            nexts[nextInd] = child;
            nextInd++;
          }
        }
      }
    }
  }
  // 次世代皇族が一人以上なら
  if (nextInd > 0){
    return true;
  }
  // 次世代皇族が０なら継承失敗
  return false;
}

// 系図を作成
function createTrees(stat) {
  // 始祖を生成
  resetNewID();
  let origins = [];
  for (let i = 0; i < g_Params.numFamilyStart; i++){
    origins[i] = new Person(null, getNewID(), 1, 1, true);
  }
  origins[0].setEmperor(EmperorKind.Emperor);
  origins[0].setAnc(0);

  // １代ずつ次世代皇族を生成
  let prevs = origins;
  let nexts = [];
  let nexts2 = [];
  for (let i = 0; i < g_Params.generation - 1; i++) {
    if (!createNextGeneration(prevs, nexts, stat)){
      stat.success = false;
      break;
    }
    // 最初に設定された男子は天皇になる
    let prince = nexts[0];
    prince.setEmperor(EmperorKind.Emperor);
    prince.setAnc(0);
    //
    if (prince.getParent().getEmperor() == EmperorKind.Emperor){
      stat.numNoAnc++;                  // 親から継承できたときの統計情報
    }
    else{
      setFlagToEmperorParents(prince, stat);  // 親戚が天皇になったときは先祖にフラグを設定
      recalcAncToNexts(nexts);                // 各皇族の天皇までの遡り数を再計算
    }

    if (i == 0){        // 最初はoriginsを上書きしないようにnexts2を設定
      prevs = nexts;
      nexts = nexts2;
    }
    else{               // それ以降はswap
      let tmp = prevs;
      prevs = nexts;
      nexts = tmp;
    }
  }
  return origins;
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
    let origins = createTrees(stat);
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
    let ancLength = 0;
    for (let i = 0; i < g_Params.generation; i++){
      g_Statistics.maxAncs[i] = 100.0 * g_Statistics.maxAncs[i] / g_Statistics.numSuccess;
      if (g_Statistics.maxAncs[i] > 0.06){
        ancLength = i;
      }
      g_Statistics.maxAncs[i] = g_Statistics.maxAncs[i].toFixed(1);
    }
    g_Statistics.maxAncs.length = ancLength + 1;
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

  // ツリー群を1回生成
  resetRnd(g_Params.pattern);
  let origins = createTrees(stat);
  //処理結果を送信
  let treeInfo = { roots: origins, stat: stat };
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
