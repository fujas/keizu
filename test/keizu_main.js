
// create an array with nodes

// 人物クラス
const NoNum = -10000;
let Person = (function(){
    // コンストラクタ
    let Person = function(id) {
        if(!(this instanceof Person)) {
            return new Person();
        }
        this.id = id;
        this.generation = NoNum;
    }
    let p = Person.prototype;

    p.setGeneration = function(generation) {
        this.generation = generation;
    }

    return Person;
})();

let tmp1 = new Person(1);
tmp1.setGeneration(1);

// 表示
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
