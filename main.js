var nodes = [];
var edges = [];
const gravityConstant = 1.1;
const repulsionForce = 1100;
const degreeForceConstant = 0.25;
const springForceConstant = 0.8;
const edgeAngleRepulsionContant = 0.1;
let center;
let pg;
var neighbours = new Map();

let gravityForces;
let chargeRepulsion;
let degreeRepulsion;
let springForces;
let edgeAngleRepulsion;

function degree(n) {
  return (neighbours.get(n) || []).length;
}

function newNode(pos, id) {
  return {
    id: id,
    pos: pos,
    force: createVector(0, 0),
    mass: () => 4*degree(id) + 4,
    update: function() {
      let velocity = p5.Vector.div(this.force, this.mass());
      this.pos.add(velocity);
    },
    draw: function() {
      pg.noStroke();
      pg.fill(0);
      pg.ellipse(this.pos.x, this.pos.y, this.mass(), this.mass())
    }
  };
}

function initNodes() {
  let nodesCount = document.getElementById("nodes").value;
  for (var i = 0; i < nodesCount; i++) {
    let x = random(width);
    let y = random(height);
    node = newNode(createVector(x, y), i);//random(1, 2.5))
    nodes.push(node);
  }
}


function addNeighbours(n1, n2) {
  if (neighbours.has(n1)) {
    neighbours.get(n1).push(n2);
  } else {
    neighbours.set(n1, [n2])
  }
  if (neighbours.has(n2)) {
    neighbours.get(n2).push(n1);
  } else {
    neighbours.set(n2, [n1])
  }
}

function initEdges() {
  let nodesCount = document.getElementById("nodes").value;
  let edgesCount = document.getElementById("edges").value;

  // Iterate though each node and connect it to a random one.
  // This is to ensure all nodes have degree > 0.
  for (var n1 = 0; n1 < Math.min(nodesCount, edgesCount); n1++) {
    let n2 = Math.floor(random(nodesCount));

    edges.push([nodes[n1], nodes[n2]]);
    addNeighbours(n1, n2);
  }

  // Iterate the remaining edges and assign them
  // between random pairs of dones.
  for (var i = 0; i < edgesCount - nodesCount; i++) {
    let n1 = Math.floor(random(nodesCount));
    let n2 = Math.floor(random(nodesCount));

    edges.push([nodes[n1], nodes[n2]]);
    addNeighbours(n1, n2);
  }
}

function applyGravity() {
  nodes.forEach(node => {
    let gravity = p5.Vector.sub(node.pos, center).mult(-1).mult(gravityConstant);
    node.force = gravity;
  });
}

function applyRepulsionForces() {
  for (let i = 0; i < nodes.length; i++) {
    let node1 = nodes[i];
    for (let j = i + 1; j < nodes.length; j++) {
      let node2 = nodes[j];
      let dir = node1.pos.copy().sub(node2.pos);
      let dist = dir.mag();

      // apply charge repulsion
      if (chargeRepulsion) {
        let force = dir.copy().div(dist * dist).mult(repulsionForce);
        node1.force.add(force);
        node2.force.sub(force);
      }

      // apply degree rupulsion
      if (degreeRepulsion) {
        let node1Deg = degree(i);
        let node2Deg = degree(j);
        let degreeForce = degreeForceConstant*((node1Deg + 1)*(node2Deg + 1))/dist;
        node1.force.add(dir.copy().mult(degreeForce));
        node2.force.sub(dir.copy().mult(degreeForce));
      }
    }
  }
}

function applySpringForces() {
  edges.forEach(edge => {
    let node1 = edge[0];
    let node2 = edge[1];
    let dir = node1.pos.copy().sub(node2.pos);
    let dist = dir.mag();
    let optimalLen = Math.log(nodes.length * nodes.length);
    let correction = (dist - optimalLen)/Math.max(Math.abs(optimalLen), Math.abs(dist));
    node1.force.sub(dir.copy().mult(correction));
    node2.force.add(dir.copy().mult(correction));
  });
}

function applyEdgeAngleRepulsion() {
  for (let centralNode of nodes) {
    let allAdjacent = neighbours.get(centralNode.id);
    if (allAdjacent == null) {
      continue;
    }
    let adjacent = allAdjacent.filter((v, i, a) => a.indexOf(v) === i);
    let optimalAngle = 2*PI/adjacent.length;
    for (let i = 0; i < adjacent.length; i++) {
      let nodeA = nodes[adjacent[i]];
      for (let j = i + 1; j < adjacent.length; j++) {
        let nodeB = nodes[adjacent[j]];
        let centralToADir = nodeA.pos.copy().sub(centralNode.pos);
        let centralToBDir = nodeB.pos.copy().sub(centralNode.pos);
        let angle = Math.abs(centralToADir.angleBetween(centralToBDir));
        let correctionAngle = edgeAngleRepulsionContant*(optimalAngle - angle);
        let newDirCentralToA = centralToADir.copy().rotate(correctionAngle);
        let desiredPosA = newDirCentralToA.copy().add(centralNode.pos);
        let force = desiredPosA.copy().sub(nodeA.pos);

        nodeA.force.add(force);
      }
    }
  };
}

function applyForces() {
  if (gravityForces) {
    applyGravity();
  }

  applyRepulsionForces();

  if (springForces) {
    applySpringForces();
  }

  if (edgeAngleRepulsion) {
    applyEdgeAngleRepulsion();
  }
}

function setup() {
  gravityForces = document.getElementById("gravity").checked;
  chargeRepulsion = document.getElementById("charge").checked;
  degreeRepulsion = document.getElementById("degree").checked;
  springForces = document.getElementById("spring").checked;
  edgeAngleRepulsion = document.getElementById("angle").checked;

  let bodyWidth = document.body.clientWidth;
  let bodyHeight = document.body.clientHeight;
  createCanvas(bodyWidth, bodyHeight);
  pg = createGraphics(bodyWidth, bodyHeight);
  center = createVector(width / 2, height / 2);
  initNodes();
  initEdges();
}

function draw() {

  // white background
  pg.background(258);

  nodes.forEach(node => {
    node.draw();
    node.update();
  });

  edges.forEach(edge => {
    pg.stroke(0);
    pg.line(edge[0].pos.x, edge[0].pos.y, edge[1].pos.x, edge[1].pos.y);
  });

  applyForces();

  image(pg, 0, 0);
}

