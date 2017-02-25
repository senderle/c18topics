var setSVG = function(width, height) { 
  return d3.select("#d3_selectable_force_directed_graph")
           .append("svg")
           .attr("width", width - 20)
           .attr("height", height - 20);
};

var appendSVG = function(svg) { 
  return svg.append("svg:defs")
            .selectAll("marker")
            .data(["end"])
            .enter()
            .append("svg:marker")
            .attr("id", String)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 20)
            .attr("refY", -0.5)
            .attr("markerWidth", 5)
            .attr("markerHeight", 5)
            .attr("orient", "auto")
            .append("svg:path")
            .attr("stroke-width", 1)
            .attr("fill", 'seagreen')
            .attr("d", "M0,-5L10,0L0,5");
}; 

var setRectangleAttributes = function(svg_graph, width, height) { 
  return svg_graph.append('svg:rect')
                  .attr('width', width)
                  .attr('height', height)
                  .attr("id", "graph-background");
}; 

var resize = function(width, svg, rect) {
  var width = window.innerWidth, height = window.innerHeight;
  svg.attr("width", width - 20)
     .attr("height", height - 20);
  rect.attr("width", width - 20)
      .attr("height", height - 20);
}; 

var onResize = function(window) { 
  d3.select(window)
    .on("resize", resize); 
};

function appendTopicLabel(node, opacity) {
    label = node.append("text")
                .attr("class", "topic-click-label")
                .attr("font-size", 10 + 'px')
                .attr("x", 10 + 'px')
                .attr("dy", ".35em")
                .attr("opacity", opacity)
                .text(function(d) { return d.name });
    return label
}

var circleClick = function(node, node_r) {
  var thisnode = d3.select(this.parentNode);
  var thislabel = thisnode.select(".topic-click-label");
  if (thislabel.empty()) {
    thislabel = appendTopicLabel(thisnode, 0, node_r);
    thislabel.transition(500)
             .attr("opacity", 1);
    thislabel.transition(500).attr("opacity", 1);
  } else {
    thislabel.transition(500)
             .attr("opacity", 0)
             .remove();
  }
}; 

var linkArc = function(d) {
  var dx = d.target.x - d.source.x;
  var dy = d.target.y - d.source.y;
  var dr = Math.sqrt(dx * dx + dy * dy);
  return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
};  

var linkLine = function(d) {
  return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
}; 

var transform = function(d) {
  return "translate(" + d.x + "," + d.y + ")";
}; 

var setUndernode = function(vis, graph) { 
  return vis.selectAll(".undernode")
            .data(graph.nodes)
            .enter()
            .append("g")
            .attr("class", "undernode"); 
};  

var checkIfGraphIsDirected = function(graph, linkArc, linkLine) { 
  if (graph.directed) {
    linkPath = linkArc
  } else {
    linkPath = linkLine
  }
};

var setLink = function(vis, graph, node_r) { 
  return vis.selectAll(".link")
            .data(graph.links)
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("opacity", function(d) { 
              return d.weight / maxWeight; 
            })
            .attr("stroke-width", node_r / 6);
}; 

var forceNodes = function(force, graph) { 
  return force.nodes(graph.nodes).links(graph.links).start();
}; 

var setGraphNodes = function(graph) { 
  for (var i = 0; i < graph.nodes.length; i++) {
      graph.nodes[i].x = 500 + Math.sin(i) * 300;
      graph.nodes[i].y = 300 + Math.cos(i) * 150;
    }
}; 

var setMaxWeight = function(graph, maxOpacity) { 
  return Math.max.apply(null, graph.links.map(function(d) { return d.weight; })) / maxOpacity;
}; 

setIdLabel = function(node_r, undernode) { 
  undernode.append("text")
           .attr("class", "id-label")
           .attr("font-size", node_r)
           .attr("text-anchor", "middle")
           .attr("dy", ".35em")
           .text(function(d) { 
              return d.id 
            });
};

var drawGraph = function(node, undernode, node_r) { 
  undernode.append("circle").attr("r", node_r); 
  idLabel = setIdLabel(node_r, undernode); 
  node.append("circle")
      .attr("r", node_r)
      .attr("opacity", 0)
      .on("click", circleClick);
}; 

var setNode = function(vis, graph) { 
  return vis.selectAll(".node")
            .data(graph.nodes)
            .enter()
            .append("g")
            .attr("class", "node");
}; 

var setJson = function(force, maxOpacity, vis, node_r) { 
  d3.json("graph.json", function(error, graph) {
    setGraphNodes(graph);
    forceNodes(force, graph);    

    maxWeight = setMaxWeight(graph, maxOpacity);

    var link = setLink(vis, graph, node_r);

    if (graph.directed) {
      link.attr("marker-end", "url(#end)");
    }

    var undernode = setUndernode(vis, graph); 
    var node = setNode(vis, graph);
    drawGraph(node, undernode, node_r); 
    appendTopicLabel(node, 1, node_r);
    checkIfGraphIsDirected(graph, linkArc, linkLine)

    function tick() {
      link.attr("d", linkPath);
      undernode.attr("transform", transform);
      node.attr("transform", transform);
    }

    for (var i = 0; i < 200 && force.alpha() > 0.009; i++) {
      force.tick();
    }

    force.on("tick", tick);

  });
}; 

var selectableForceDirectedGraph = function() {
  var node_r = 10;
  var maxOpacity = 1;
  var width = window.innerWidth;
  var height = window.innerHeight;
  var xScale = d3.scale.linear().domain([0,width]).range([0,width]);
  var yScale = d3.scale.linear().domain([0,height]).range([0, height]);
  var svg = setSVG(width, height);
  var force = d3.layout.force().charge(-3000).gravity(0.65).linkDistance(20).size([width, height]);
  var zoomer = d3.behavior.zoom().scaleExtent([0.1,10]).x(xScale).y(yScale).on("zoom", redraw);
  var svg_graph = svg.append('svg:g').call(zoomer);
  var rect = setRectangleAttributes(svg_graph, width, height);
  var vis = svg_graph.append("svg:g");

  appendSVG(svg);

  function redraw() {
    vis.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
  }; 

  function resize() {
    var width = window.innerWidth, height = window.innerHeight;
    svg.attr("width", width - 20).attr("height", height - 20);
    rect.attr("width", width - 20).attr("height", height - 20);
  }; 
  
  d3.select(window).on("resize", resize); 

 
  setJson(force, maxOpacity, vis, node_r);

}; 

selectableForceDirectedGraph();
