//
// 男系系図シミュレーター (C)Github/fujas 2020
//
// 天皇を男子で継承するときの系図を、指定の条件でシミュレーションして作図します。
// 系図の起点は「未来の架空の天皇」であり、その天皇まで同じ条件で継承されたものと仮定します。
//

// ************ 共通 **********
// 表示枝刈用フラグ
const EmperorKind = {
  Normal: 0,       // 天皇ではない人
  EmperorParent: 1,   // 天皇ではないがその先祖の男子
  Emperor: 2          // 天皇
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
  col = (person.emperor == EmperorKind.Emperor) ? "#8888ff" : col;
  col = (person.emperor == EmperorKind.EmperorParent) ? "#88ff88" : col;
  // 文字（王にのみ世代の数を表記）
  let str = (person.emperor == EmperorKind.Emperor) ? "  " + String(person.generation + 200) + "  " : "";
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
    if (!g_Params.hideBranch || child.emperor != EmperorKind.Normal) {
      createNode(child, nodeArr);
      createEdge(person, child, edgeArr);
    }
  }
  // 各子に対して再帰呼び出し
  for (let child of person.child) {
    if (!g_Params.hideBranch || child.emperor != EmperorKind.Normal) {
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
      "計算中 " + message.data.type.toFixed(0) + "%"
    );
  }
  // 統計結果
  else{
    let statstat = message.data.statstat;
    $("#i_statStat").text(
      g_Params.generation.toFixed(0) +
      "代継承成功率:" + statstat.ratio.toFixed(1) + "% " + 
      " 平均最高遡り数:" + statstat.max.toFixed(1) +
      " 子供継承率:" + statstat.child.toFixed(1) + "%");
  }
}

// UIの値を取得し、上限下限に合わせてUIの値を変更し、値を返す
function getAndLimitValue(ctrlStr, isInt, modifyUI){
  let val, min, max;
  if (isInt){
    val = parseInt($(ctrlStr).val(), 10);
    max = parseInt($(ctrlStr).attr('max'), 10);
    min = parseInt($(ctrlStr).attr('min'), 10);
  }
  else{
    val = Number($(ctrlStr).val(), 10);
    max = Number($(ctrlStr).attr('max'), 10);
    min = Number($(ctrlStr).attr('min'), 10);
  }
  if (isNaN(val)){
    val = min;
  }
  if (val > max){
    val = max;
  }
  if (val < min){
    val = min;
  }
  if (modifyUI){
    $(ctrlStr).val(val);
  }
  return val;
}

// UIからのパラメータの取得
function getParams(modifyUI) {
  g_Params.numChild = getAndLimitValue("#i_numChild", false, modifyUI);
  g_Params.maleRatio = getAndLimitValue("#i_maleRatio", false, modifyUI);
  g_Params.generation = getAndLimitValue("#i_generation", true, modifyUI);
  g_Params.pattern = getAndLimitValue("#i_pattern", true, modifyUI);
  g_Params.ancLimit = getAndLimitValue("#i_ancLimit", true, modifyUI);
  g_Params.hideBranch = ($('[id="i_hideBranch"]:checked').val() == "on") ? true : false;
  g_Params.numPattern = getAndLimitValue("#i_numPattern", true, modifyUI);
  g_Params.numPattern *= 10000;
}

// 系図の更新
let g_UpdateCount = 0;
let g_UpdateUICount = 0;
let g_Worker = null;
let g_WorkerWoremperor = false;

// 表示ツリーと統計情報の更新
function updateTreeMain(){
  // 最後のタイマー呼び出しの時だけ処理する
  g_UpdateCount--;
  if (g_UpdateCount <= 0){
    // パラメーターを取得
    getParams(false);
    // ワーカーが動いていたら（または初回なら）止めてワーカーを再生成
    if (g_WorkerWoremperor || g_Worker == null){
      if (g_Worker != null){
        g_Worker.terminate();
      }
      g_Worker = new Worker("app/keizu_tree.js");
    }
    // 別スレッドでツリーを生成＆統計計算、ツリーと統計情報をこのスレッドで取得して表示
    g_WorkerWoremperor = true;
    g_Worker.addEventListener("message", workerListener, false);
    g_Worker.postMessage(g_Params);
  }
}

// 不正な入力値の画面上での更新
function updateUIMain(){
  // 最後のタイマー呼び出しの時だけ処理する
  g_UpdateUICount--;
  if (g_UpdateUICount <= 0){
    // 不正な入力値を画面上でも修正（g_Paramsの値は修正済み）
    getParams(true);
  }
}

// ツリーと統計情報の更新
function updateTree(){
  // あまり頻繁に更新しないように、またチェックを正しく認識できるように、タイマーで起動
  // 表示ツリーと統計情報の更新
  g_UpdateCount++;
  setTimeout(updateTreeMain, 200);
  // 不正な入力値の画面上での更新
  g_UpdateUICount++;
  setTimeout(updateUIMain, 2500);
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
  $("#i_numPattern").bind('keyup mouseup', updateTree);
}

// ********** メイン **********

// イベント処理関数を登録
applyEventFunc();
// パラメータ初期値をhtmlから取得
getParams(false);
// ツリーの1つの生成と表示
updateTree();