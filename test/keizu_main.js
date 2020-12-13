// 系図作成プログラム (C)Github/fujas 2020
//
// 王家を男子で継承するときの系図を、指定の条件でシミュレーションして作図します。
// 系図の起点は「未来の架空の王」であり、その王まで同じ条件で継承されたものと仮定します。
//

// ********** パラメーター **********

// 生成パラメーター
function Params() {
  // 値はgetParams() で取得
  this.pattern = 1;          // 乱数シード
  this.numChild = 1;      // 子供の数
  this.maleRatio = 1;     // 男子が生まれる割合％
  this.generation = 1;    // 生成する世代の数
  this.pattern = 1;       // 生成パターン数
  this.ancLimit = 1;      // 先祖を遡る世代の上限（父なら１、祖父なら２）
  this.hideBranch = false; // 表示時に直系以外を隠す
  this.numPattern = 1;    // 統計計算時パターン総数
}
let g_Params = new Params();

// 生成情報パラメーター
function TreeStat(){
  this.success = true;      // 指定世代まで継承できたらtrue
  this.maxAnc = 1;          // 最も遡った世代数
  this.numNoAnc = 0;        // 子に継承できた回数
}

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
  }

  return Random;
})();
let g_myRnd = new Random(1);

function resetRnd(seed){
  g_myRnd = new Random(seed); // パターンIDを乱数シードにする
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
  return g_Params.numChild;
}

// ********** 人物クラス **********
// 表示枝刈用フラグ
const KingKind = {
  Normal: 0,       // 普通の人
  KingParent: 1,   // 王ではないがその先祖の男
  King: 2          // 王
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
    this.king = KingKind.Normal;    // 表示用の王かどうかのフラグ
    // メンバ変数（リンク）
    this.parent = parent;           // 父親へのポインタ
    this.child = [];                // 子供へのポインタ配列
    // メンバ変数（内部フラグ）
    this.childCreated = false;      // 子供を全部作ったらtrue
    this.noFamily = false;          // 子孫が途絶えることが確定したらtrue
  }
  let p = Person.prototype;

  // Getter
  p.getParent = function () { return this.parent; }

  // Setter
  p.setKing = function (kind) { this.king = kind; }
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
      // 子孫が途絶えていない男だけを探す
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

// 王の先祖にフラグを付ける
function setFlagToKingParents(king) {
  // kingが王であるかチェック。
  if (king.king != KingKind.King) {
    return;
  }

  let parent = king;
  while (1) {
    // 親がいない、またはすでに王か王の祖先なら処理終了。
    parent = parent.getParent();
    if (parent == null || parent.king != KingKind.Normal) {
      return;
    }
    // 王の先祖フラグを付ける。
    parent.king = KingKind.KingParent;
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
      // 親が王やその祖先であれば王の祖先フラグを付ける
      if (prev.king != KingKind.Normal) {
        parent.setKing(KingKind.KingParent);
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
  origin.setKing(KingKind.King);

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
    prince.setKing(KingKind.King);  // 王フラグを設定
    setFlagToKingParents(prince);   // 王の先祖にフラグを設定
    person = prince;
  }
  return origin;
}

// ********** 表示関数 **********

// ノードを一個生成
function createNode(person, nodeArr) {
  // 色
  let col = person.male ? "#bbccff" : "#ffcccc";
  col = (person.king == KingKind.King) ? "#8888ff" : col;
  col = (person.king == KingKind.KingParent) ? "#88ff88" : col;
  // 文字（王にのみ世代の数を表記）
  let str = (person.king == KingKind.King) ? "  " + String(person.generation + 200) + "  " : "";
  nodeArr.push({ id: person.id, label: str, level: person.generation, color: col });
}
// エッジを一個生成
function createEdge(parent, child, edgeArr) {
  edgeArr.push({ from: parent.id, to: child.id });
}

// ノードとエッジの取得関数
function getNodeAndEdgeRecurs(person, nodeArr, edgeArr, top) {
  // 最初だけ自分のノードを作成
  if (top) {
    createNode(person, nodeArr);
  }
  // 子のノードを作り、親子のエッジを作成
  for (let child of person.child) {
    if (!g_Params.hideBranch || child.king != KingKind.Normal) {
      createNode(child, nodeArr);
      createEdge(person, child, edgeArr);
    }
  }
  // 各子に対して再帰呼び出し
  for (let child of person.child) {
    if (!g_Params.hideBranch || child.king != KingKind.Normal) {
      getNodeAndEdgeRecurs(child, nodeArr, edgeArr, false);
    }
  }
}

// 表示メイン
function displayMain(person) {

  // ツリー構造から配列データを生成
  let nodeArr = [];
  let edgeArr = [];
  let rootParent = findRoot(person);
  getNodeAndEdgeRecurs(rootParent, nodeArr, edgeArr, true)

  // vis.js にデータを渡す
  var container = document.getElementById("mynetwork");
  var data = {
    nodes: nodeArr,
    edges: edgeArr,
  };
  var options = { layout: { hierarchical: true } };
  var network = new vis.Network(container, data, options);
}

// ********** イベント処理 **********

// ツリーの生成と表示
function createAndDisplayTree() {
  // 乱数をパターンIDのseedで初期化
  resetRnd(g_Params.pattern);
  // ツリーを生成
  let stat = new TreeStat();
  let origin = createTree(stat);

  if (stat.success){
    $("#i_stat").text("継承成功");
  }else{
    $("#i_stat").text("継承失敗");
  }
  // ツリーを表示
  displayMain(origin);
}

// 統計を取る
function calcStatistics(){
  // 統計情報の初期化
  let numSuccess = 0;
  let maxAnc = 0;
  let noAnc = 0;
  //
  for (let i = 0; i < g_Params.numPattern; i++){
    // 乱数をiのseedで初期化
    resetRnd(i);
    // ツリーを生成
    let stat = new TreeStat();
    let origin = createTree(stat);
    // 成功時は統計情報を取得
    if (stat.success){
      numSuccess++;
      maxAnc += stat.maxAnc;
      noAnc += stat.numNoAnc;
    }
  }
  // 統計情報を整理
  let successRat = 100.0 * numSuccess / g_Params.numPattern;
  if (numSuccess > 0){
    maxAnc = maxAnc / numSuccess;
    noAnc = 100.0 * (noAnc / numSuccess) / (g_Params.generation - 1);
  }
  $("#i_statStat").text(
    "継承成功率:" + successRat.toFixed(5) + "% " + 
    " 平均最高遡り数:" + maxAnc.toFixed(5) +
    " 子供継承率:" + noAnc.toFixed(5)) + "%";
}

// パラメータの取得
function getParams() {
  g_Params.numChild = Number($("#i_numChild").val(), 10);
  g_Params.maleRatio = Number($("#i_maleRatio").val(), 10);
  g_Params.generation = parseInt($("#i_generation").val(), 10);
  g_Params.pattern = parseInt($("#i_pattern").val(), 10);
  g_Params.ancLimit = parseInt($("#i_ancLimit").val(), 10);
  g_Params.hideBranch = ($('[id="i_hideBranch"]:checked').val() == "on") ? true : false;
  g_Params.numPattern = parseInt($("#i_numPattern").val(), 10);
  g_Params.numPattern *= 10000;
}

// イベント関数の登録
function applyEventFunc() {

  // 更新ボタン
  $(document).on("click", "#i_refresh", function () {
    // パラメーターを取得
    getParams();
    // ツリーの生成と表示
    createAndDisplayTree();
  });

  // 更新ボタン
  $(document).on("click", "#i_statistics", function () {
    // パラメーターを取得
    getParams();
    // 統計情報の計算
    calcStatistics();
  });

}

// ********** メイン **********

// イベント処理関数を登録
applyEventFunc();
// パラメータ初期値をhtmlから取得
getParams();
// ツリーの生成と表示
createAndDisplayTree();
