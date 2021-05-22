//
// 男子継承シミュレーター (C)Github/fujas 2021
//

// ********** イベント処理 **********

// workerスレッドメイン
function TestMain() {

  /*
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
*/

resetRnd(0);

console.log(g_myRnd.get());
console.log("a:", g_myRnd.get(), "b:", g_myRnd.get());

console.log("Test Message");
console.log("Test Message 2");

}

// ******** メイン ********
TestMain();

