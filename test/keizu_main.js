// 系図作成プログラム

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
  let percent = 50;     // 男が生まれる割合（％）
  let retVal = (percent > Math.random() * 100) ? true : false;
  return retVal;
}

// 子供の数の決定関数
function defineNumChild() {
  return 2;
}

// ********** 人物クラス **********

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
    this.king = false;              // 王位を継いだらtrue
    // メンバ変数（リンク）
    this.parent = parent;           // 父親へのポインタ
    this.child = [];                // 子供へのポインタ配列
    // メンバ変数（内部フラグ）
    this.childCreated = false;      // 子供を全部作ったらtrue
    this.parent = parent;           // 父親へのポインタ
    this.noFamily = false;          // 子孫が途絶えることが確定したらtrue
  }
  let p = Person.prototype;

  // Getter
  p.getParent = function () { return this.parent; }

  // Setter
  p.setKing = function () { this.king = true; }
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

// 生成した最も前の世代の人物を返す
function findRoot(person) {
  let rootParent = person;
  while (rootParent.getParent() != null) {
    rootParent = rootParent.getParent();
  }
  return rootParent;
}

// 子孫が途絶えているか不明な親までさかのぼる（必要なら親を生成）
function backTrackPrince(person) {
  let parent = person;
  do {
    let prev = parent;
    parent = parent.parent;
    if (parent == null) {
      // 親が未定義なら生成
      parent = prev.createParent();
    }
  } while (parent.noFamily == true);  // 子孫が途絶えている親ならさらに遡る

  return parent;
}

// 指定の世代まで世継ぎを作る
function forwardTrackPrince(person, generation) {

  let prince = null;
  let parent = person;
  do {
    // 子孫が途絶えていない男子を探す
    parent.createChildren();
    prince = parent.getPrince();

    // 男子がいないとき
    if (prince == null) {
      parent.setNoFamily(); // 断絶フラグを設定
      // 親をさかのぼって男子とする
      prince = backTrackPrince(parent);
    }
    // 先祖が遠すぎて断念したときはnullを返す
    if (prince == null) {
      return null;
    }

    // 規定の世代まで王子を生成
    parent = prince;
  } while (prince.generation < generation);

  return prince;
}


// ********** 表示関数 **********

// ノードを一個生成
function createNode(person, nodeArr) {
  let col = person.male ? "#bbccff" : "#ffcccc";
  col = person.king ? "#8888ff" : col;
  nodeArr.push({ id: person.id, label: "node", level: person.generation, color: col });
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
    createNode(child, nodeArr);
    createEdge(person, child, edgeArr);
  }
  // 各子に対して再帰呼び出し
  for (let child of person.child) {
    getNodeAndEdgeRecurs(child, nodeArr, edgeArr, false);
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


// ********** メイン **********

// 始祖を生成
resetNewID();
let origin = new Person(null, getNewID(), 1, true);
origin.setKing();

// １代ずつ子孫を生成（TODO: 1度のforward呼び出しでkingフラグを付けられないか？）
let person = origin;
for (let i = 0; i < 10; i++) {
  person = forwardTrackPrince(person, person.generation + 1);
  if (person == null) {
    break;
  }
  person.setKing(); // kingフラグは表示にのみ使用
}

// ツリーを表示
displayMain(origin);

// TODO: 枝かり表示、代の表示、GUI、複雑時のストップ機能、止まる症状の調査
