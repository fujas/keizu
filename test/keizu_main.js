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
  return true;
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
    this.parent = parent;           // 父親へのポインタ
    this.id = id;                   // 表示制御用ID
    this.generation = generation;   // 世代。起点以前なら負の数になる。
    this.male = male;               // 性別(trueで男)
    this.child = [];                // 子供へのポインタ配列
    // メンバ変数（内部フラグ）
    this.childCreated = false;      // 子供を全部作ったらtrue
    this.noChild = false;           // 子孫が途絶えることが確定したらtrue
  }
  let p = Person.prototype;

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
  p.createParent = function(){
    let gene = this.generation - 1;
    let parent= new Person(null, getNewID(), gene, true); // １世代前の男として生成
    parent.child[0] = this;     // 必ず自分を子供に設定
    parent.createChildren();    // 自分以外の子供を生成
    return parent;
  }

  // 世継ぎ取得関数
  p.getPrince = function(){
    // 子供を作っていなければ生成
    this.createChildren();
    // 子供に男がいればそれを返す
    for (let child of this.child){
      if (child.male){
        return child;
      }
    }
    // 男がいなければnull
    return null;
  }

  return Person;
})();

// ********** １世代先の世継ぎを生成する関数群 **********

function createPrince(person){
  person.createChildren();
  let prince = person.getPrince();
  if (prince == null){



    // backTrackPrince(person, person.generation + 1);



  }
  return prince;
}




// ********** 表示関数 **********

// 表示
function display() {
  let arr = [];
  let id = 1;
  let label = "Node 10";
  arr[0] = { id: id, label: label };
  arr[1] = { id: 2, label: "Node 20" };
  var nodes = new vis.DataSet(arr);

  // create an array with edges
  var edges = new vis.DataSet([
    { from: 1, to: 2 },
  ]);

  // create a network
  var container = document.getElementById("mynetwork");
  var data = {
    nodes: nodes,
    edges: edges,
  };
  var options = {};
  var network = new vis.Network(container, data, options);
}

// ********** メイン **********

let origin = new Person(null, getNewID(), 1, true);
origin.createChildren();
origin.createParent();

display();

