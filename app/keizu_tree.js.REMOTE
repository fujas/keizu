//
// 男子継承シミュレーター (C)Github/fujas 2020
//
// 天皇を男子で継承するときの系図を、指定の条件でシミュレーションして作図します。
// 系図の起点は「未来の架空の天皇」であり、その天皇まで同じ条件で継承されたものと仮定します。
//

// シード付き乱数のコードを拝借したもの
// Copyright 2019 David Bau.
!function(f,a,c){var s,l=256,p="random",d=c.pow(l,6),g=c.pow(2,52),y=2*g,h=l-1;function n(n,t,r){function e(){for(var n=u.g(6),t=d,r=0;n<g;)n=(n+r)*l,t*=l,r=u.g(1);for(;y<=n;)n/=2,t/=2,r>>>=1;return(n+r)/t}var o=[],i=j(function n(t,r){var e,o=[],i=typeof t;if(r&&"object"==i)for(e in t)try{o.push(n(t[e],r-1))}catch(n){}return o.length?o:"string"==i?t:t+"\0"}((t=1==t?{entropy:!0}:t||{}).entropy?[n,S(a)]:null==n?function(){try{var n;return s&&(n=s.randomBytes)?n=n(l):(n=new Uint8Array(l),(f.crypto||f.msCrypto).getRandomValues(n)),S(n)}catch(n){var t=f.navigator,r=t&&t.plugins;return[+new Date,f,r,f.screen,S(a)]}}():n,3),o),u=new m(o);return e.int32=function(){return 0|u.g(4)},e.quick=function(){return u.g(4)/4294967296},e.double=e,j(S(u.S),a),(t.pass||r||function(n,t,r,e){return e&&(e.S&&v(e,u),n.state=function(){return v(u,{})}),r?(c[p]=n,t):n})(e,i,"global"in t?t.global:this==c,t.state)}function m(n){var t,r=n.length,u=this,e=0,o=u.i=u.j=0,i=u.S=[];for(r||(n=[r++]);e<l;)i[e]=e++;for(e=0;e<l;e++)i[e]=i[o=h&o+n[e%r]+(t=i[e])],i[o]=t;(u.g=function(n){for(var t,r=0,e=u.i,o=u.j,i=u.S;n--;)t=i[e=h&e+1],r=r*l+i[h&(i[e]=i[o=h&o+t])+(i[o]=t)];return u.i=e,u.j=o,r})(l)}function v(n,t){return t.i=n.i,t.j=n.j,t.S=n.S.slice(),t}function j(n,t){for(var r,e=n+"",o=0;o<e.length;)t[h&o]=h&(r^=19*t[h&o])+e.charCodeAt(o++);return S(t)}function S(n){return String.fromCharCode.apply(0,n)}if(j(c.random(),a),"object"==typeof module&&module.exports){module.exports=n;try{s=require("crypto")}catch(n){}}else"function"==typeof define&&define.amd?define(function(){return n}):c["seed"+p]=n}("undefined"!=typeof self?self:this,[],Math);
// シード付き乱数ここまで


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


// ********** シード付き乱数 **********
// "JavaScriptで再現性のある乱数を生成する + 指定した範囲の乱数を生成する" を参考にさせていただきました。
/*
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
*/
let g_myRnd;

function resetRnd(seed){
  g_myRnd = new Math.seedrandom(String(seed)); // パターンIDを乱数シードにする
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
  let retVal = (g_Params.maleRatio > g_myRnd.quick() * 100) ? true : false;
  return retVal;
}

// 子供の数の決定関数
function defineNumChild() {
  // 小数点も考慮。2.5なら2人か3人。
  let numInt = Math.floor(g_Params.numChild);
  let numDecimal = g_Params.numChild - numInt;
  numInt = (numDecimal > g_myRnd.quick()) ? numInt + 1 : numInt;
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
