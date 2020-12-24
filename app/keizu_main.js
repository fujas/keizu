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
function displayTree(treeInfo){
  // ツリー生成中に新たにイベントが発生したら、表示しない
  if (g_UpdateCount <= 0){
    // ツリーを表示
    let originData = treeInfo.root;
    displayMain(originData);
    // 成功か失敗かの文字を更新
    if (treeInfo.stat.success){
      $("#i_stat").text("継承成功");
    }else{
      $("#i_stat").text("継承失敗");
    }
  }
}

// ********** イベント処理 **********

// ワーカーからのイベント取得
function workerListener(message){
  // 表示用ツリー情報
  if (message.data.type == 0){
    displayTree(message.data.tree);
  }
  // 統計計算
  else if (message.data.type < 100){
    $("#i_statStat").text(
      "統計情報計算中 " + message.data.type.toFixed(0) + "%"
    );
  }
  // 統計結果
  else{
    let statstat = message.data.statstat;
    $("#i_statStat").text(
      g_Params.generation.toFixed(0) +
      "代継承成功率:" + statstat.ratio.toFixed(2) + "% " + 
      " 平均最高遡り数:" + statstat.max.toFixed(2) +
      " 子供継承率:" + statstat.child.toFixed(2) + "%");
  }
}

// UIからのパラメータの取得
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
let g_UpdateCount = 0;
let g_Worker = null;
let g_WorkerWorking = false;

function updateTreeMain(){
  // 最後のタイマー呼び出しの時だけ処理する
  g_UpdateCount--;
  if (g_UpdateCount <= 0){
    // パラメーターを取得
    getParams();
    // ワーカーが動いていたら（または初回なら）止めてワーカーを再生成
    if (g_WorkerWorking || g_Worker == null){
      if (g_Worker != null){
        g_Worker.terminate();
      }
      g_Worker = new Worker("keizu_tree.js");
    }
    // 別スレッドでツリーを生成＆統計計算、ツリーと統計情報をこのスレッドで取得して表示
    g_WorkerWorking = true;
    g_Worker.addEventListener("message", workerListener, false);
    g_Worker.postMessage(g_Params);
  }
}

// ツリーと統計情報の更新
function updateTree(){
  // あまり頻繁に更新しないように、またチェックを正しく認識できるように、タイマーで起動
  // 表示ツリーの更新
  g_UpdateCount++;
  setTimeout(updateTreeMain, 200);  // ツリー生成がこの時間よりも長いとイベントがたまってしまう
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
}

// ********** メイン **********

// イベント処理関数を登録
applyEventFunc();
// パラメータ初期値をhtmlから取得
getParams();
// ツリーの1つの生成と表示
updateTree();