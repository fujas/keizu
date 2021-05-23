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
      m: "再現テスト 子供3人",
      a: 41.8,
      p:{ numChild: 3, maleRatio: 51.3, liveRatio: 92.1, generation: 30, numFamilyStart: 1, numFamilyMax: 5, maxAnc: 5 }
    },
    {
      m: "再現テスト 子供3.5人",
      a: 63.7,
      p:{ numChild: 3.5, maleRatio: 51.3, liveRatio: 92.1, generation: 30, numFamilyStart: 1, numFamilyMax: 5, maxAnc: 5 }
    },
    {
      m: "確率テスト子供2人50％3世代",
      a: 61.0,
      p:{ numChild: 2, maleRatio: 50, liveRatio: 100, generation: 3, numFamilyStart: 1, numFamilyMax: 5, maxAnc: 5 }
    },
    {
      m: "確率テスト子供3人2世代",
      a: 87.5,
      p:{ numChild: 3, maleRatio: 50, liveRatio: 100, generation: 2, numFamilyStart: 1, numFamilyMax: 5, maxAnc: 5 }
    },
    {
      m: "子を残す割合のテスト",
      a: 25.0,
      p:{ numChild: 1, maleRatio: 100, liveRatio: 50, generation: 3, numFamilyStart: 1, numFamilyMax: 5, maxAnc: 5 }
    },
    {
      m: "http://ore-dmng.jp/ore/lra/prob_dankei.html のテスト",
      a: 39.9,
      p:{ numChild: 2, maleRatio: 50, liveRatio: 100, generation: 6, numFamilyStart: 1, numFamilyMax: 10, maxAnc: 6 }
    },
    {
      m: "http://waqoo.blog16.fc2.com/blog-entry-83.html の複数宮家テスト1",
      a: 76.6,
      p:{ numChild: 2, maleRatio: 50, liveRatio: 100, generation: 4, numFamilyStart: 2, numFamilyMax: 10, maxAnc: 5 }
    },
    {
      m: "http://waqoo.blog16.fc2.com/blog-entry-83.html の複数宮家テスト2",
      a: 97.3,
      p:{ numChild: 2, maleRatio: 50, liveRatio: 100, generation: 4, numFamilyStart: 5, numFamilyMax: 10, maxAnc: 5 }
    },
    {
      m: "https://www.a-takamori.com/post/201013 の直系限定テスト1（遠縁1）",
      a: 10.0,
      p:{ numChild: 2, maleRatio: 50, liveRatio: 100, generation: 9, numFamilyStart: 1, numFamilyMax: 5, maxAnc: 1 }
    },
    {
      m: "https://www.a-takamori.com/post/201013 の直系限定テスト2（宮家１）",
      a: 10.0,
      p:{ numChild: 2, maleRatio: 50, liveRatio: 100, generation: 9, numFamilyStart: 1, numFamilyMax: 1, maxAnc: 5 }
    },
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
  console.log((i == success) ? "***** テスト成功 *****" : "### テスト失敗 ###");

  // テストフラグを戻す
  g_IsTest = false;
}

TestMain();

