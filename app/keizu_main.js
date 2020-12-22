//
// 系図作成プログラム (C)Github/fujas 2020
//
// 王家を男子で継承するときの系図を、指定の条件でシミュレーションして作図します。
// 系図の起点は「未来の架空の王」であり、その王まで同じ条件で継承されたものと仮定します。
//

// ************ 共通 **********
// 表示枝刈用フラグ
const KingKind = {
  Normal: 0,       // 普通の人
  KingParent: 1,   // 王ではないがその先祖の男
  King: 2          // 王
}

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

// 統計計算用パラメーター
function StatisticsParams(){
  this.numSuccess = 0;
  this.maxAnc = 0;
  this.noAnc = 0;
  this.currIndex = 0;
  this.updateProgress = false;
}
let g_Statistics = new StatisticsParams();

// 生成情報パラメーター
function TreeStat(){
  this.success = true;      // 指定世代まで継承できたらtrue
  this.maxAnc = 1;          // 最も遡った世代数
  this.numNoAnc = 0;        // 子に継承できた回数
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
  getNodeAndEdgeRecurs(person, nodeArr, edgeArr, true)

  // vis.js にデータを渡す
  var container = document.getElementById("mynetwork");
  var data = {
    nodes: nodeArr,
    edges: edgeArr,
  };
  var options = { layout: { hierarchical: true } };
  var network = new vis.Network(container, data, options);
}

// ********** ツリーの生成と統計処理 **********

// ツリーの生成と表示
function displayTree(origin){
  // ツリー生成中に新たにイベントが発生したら、表示しない
  if (g_treeUpdating <= 0){

    // ツリーを表示
    let originData = origin.data.root;
    displayMain(originData);
    // 成功か失敗かの文字を更新
    if (origin.data.stat.success){
      $("#i_stat").text("継承成功");
    }else{
      $("#i_stat").text("継承失敗");
    }

  }
}

// 統計を取る
function calcStatistics(){
  /*
  //
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
      g_Statistics.noAnc += stat.numNoAnc;
    }
  }
  // 統計情報を整理
  let successRat = 100.0 * g_Statistics.numSuccess / g_Params.numPattern;
  if (g_Statistics.numSuccess > 0){
    g_Statistics.maxAnc = g_Statistics.maxAnc / g_Statistics.numSuccess;
    g_Statistics.noAnc = 100.0 * (g_Statistics.noAnc / g_Statistics.numSuccess) / (g_Params.generation - 1);
  }
  $("#i_statStat").text(
    g_Params.generation.toFixed(0) +
    "代継承成功率:" + successRat.toFixed(2) + "% " + 
    " 平均最高遡り数:" + g_Statistics.maxAnc.toFixed(2) +
    " 子供継承率:" + g_Statistics.noAnc.toFixed(2)) + "%";
    */
}

// ********** イベント処理 **********

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

// 系図の更新
let g_treeUpdating = 0;
let g_Worker;

function updateTreeMain(){
  // 最後のタイマー呼び出しの時だけ処理する
  g_treeUpdating--;
  if (g_treeUpdating <= 0){
    // パラメーターを取得
    getParams();
    // 別スレッドでツリーを生成、ツリーをこのスレッドで取得して表示
    g_Worker.addEventListener("message", displayTree, false);
    g_Worker.postMessage(g_Params);
  }
}

// 統計情報の更新
let g_statisticsUpdating = 0;

function updateStatisticsMain(){
  g_statisticsUpdating--;
  if (g_statisticsUpdating <= 0){
    // パラメーターを取得
    getParams();
    // 統計計算
    g_Statistics.numSuccess = 0;
    g_Statistics.maxAnc = 0;
    g_Statistics.noAnc = 0;
    g_Statistics.currIndex = 0;
    g_Statistics.updateProgress = false;
    // 統計情報の計算
//    calcStatistics(); TODO:
  }
}

function updateTree(){
  // あまり頻繁に更新しないように、またチェックを正しく認識できるように、タイマーで起動
  // 表示ツリーの更新
  g_treeUpdating++;
  setTimeout(updateTreeMain, 200);  // ツリー生成がこの時間よりも長いとイベントがたまってしまう
  // 統計情報の更新
  g_statisticsUpdating++;
  setTimeout( updateStatisticsMain, 570);
}

// イベント関数の登録
function applyEventFunc() {

  // 各パラメーターの変更イベント
  $("#i_numChild").bind('keyup mouseup', updateTree);
  $("#i_maleRatio").bind('keyup mouseup', updateTree);
  $("#i_generation").bind('keyup mouseup', updateTree);
  $("#i_pattern").bind('keyup mouseup', updateTree);
  $("#i_ancLimit").bind('keyup mouseup', updateTree);
  $("#i_hideBranch").bind('keyup mouseup', updateTree);
  // ワーカースレッドの準備
  g_Worker = new Worker("keizu_tree.js");

}

// ********** メイン **********

// イベント処理関数を登録
applyEventFunc();
// パラメータ初期値をhtmlから取得
getParams();
// ツリーの1つの生成と表示
//createAndDisplayTree();
// 統計情報の計算
//calcStatistics();

updateTree();