//
// 男子継承シミュレーター (C)Github/fujas 2021
//
// テストプログラム
// (keizu_tree.js の関数を呼び出して確率計算プログラムをテストします)
//

// ********** パラメーター設定 **********

// 生成用パラメーター
function Params() {
  // 値はgetParams() で取得
  this.pattern = 1;       // 乱数シード
  this.numChild = 1;      // 子供の数
  this.maleRatio = 1;     // 男子が生まれる割合％
  this.liveRatio = 1;     // 男女問わず子を残す割合％
  this.generation = 1;    // 生成する世代の数

  this.numFamilyStart = 5;// 開始時皇族夫婦数
  this.numFamilyMax = 5;  // 最大皇族夫婦数
  this.maxAnc = 5;       // 遠縁の上限（最大遡り数）

  this.hideBranch = false;// 表示時に直系以外を隠す
  this.numPattern = 1;    // 統計計算時パターン総数
}

function GetParams(ind){
  let array = [
    {
      m: "基本テスト 子供3人",
      a: 41.8,
      p:{ numChild: 3, maleRatio: 51.3, liveRatio: 92.1, generation: 30, numFamilyStart: 1, numFamilyMax: 5, maxAnc: 5 }
    },
    {
      m: "基本テスト 子供3.5人",
      a: 63.7,
      p:{ numChild: 3.5, maleRatio: 51.3, liveRatio: 92.1, generation: 30, numFamilyStart: 1, numFamilyMax: 5, maxAnc: 5 }
    }
  ];

  if (ind >= array.length){
    return null;
  }

  var retVal = {};
  retVal.m = array[ind].m;
  retVal.a = array[ind].a;
  retVal.p = array[ind].p;
  retVal.p.pattern = 1;
  retVal.p.hideBranch = false;
  retVal.p.numPattern = 50000;
  return retVal;
}

// ******** メイン ********

// テストメイン関数
function TestMain() {
  // テストフラグ
  g_IsTest = true;

  // テストループ
  let i = 0;
  let success = 0;
  while(1){
    // パラメータを設定
    let params = GetParams(i);
    if (params == null){
      break;
    }
    g_Params = params.p;

    // 続けて統計処理
    g_Statistics = new StatisticsParams();
    // 統計情報の計算
    let statStat = calcStatistics();
    // 結果判定
    let result = (Math.abs(params.a - statStat.ratio) < 0.3) ? true : false;
    success += (result) ? 1 : 0;
    // ログ表示
    console.log(params.m, params.a, "結果: ", statStat.ratio, result);

    i++;
  }

  // 最終結果表示
  console.log("テスト数", i, "成功数", success);

  // テストフラグを戻す
  g_IsTest = false;
}

TestMain();

