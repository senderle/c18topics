var selectSVG = function(width, height) { 
  return d3.select("#d3_selectable_force_directed_graph").append("svg").attr("width", width - 20).attr("height", height - 20);
}; 

var appendSVG = function(svg) { 
  return svg.append("svg:defs").selectAll("marker");
}; 

var enterSVG = function(selectAll) { 
  return selectAll.data(["end"]).enter().append("svg:marker");
};

var setAttributes = function(enter) { 
   enter.attr("id", String).attr("viewBox", "0 -5 10 10").attr("refX", 20).attr("refY", -0.5).attr("markerWidth", 5).attr("markerHeight", 5).attr("orient", "auto").append("svg:path").attr("stroke-width", 1).attr("fill", 'seagreen').attr("d", "M0,-5L10,0L0,5");
}

var setRectangleAttributes = function(svg_graph, width, height) { 
  return svg_graph.append('svg:rect').attr('width', width).attr('height', height).attr("id", "graph-background");
}; 

var resize = function(width, svg, rect) {
  var width = window.innerWidth, height = window.innerHeight;
  svg.attr("width", width - 20).attr("height", height - 20);
  rect.attr("width", width - 20).attr("height", height - 20);
}; 



function selectableForceDirectedGraph() {
  var node_r = 10;
  var maxOpacity = 1;
  var width = window.innerWidth;
  var height = window.innerHeight;
  var xScale = d3.scale.linear().domain([0,width]).range([0,width]);
  var yScale = d3.scale.linear().domain([0,height]).range([0, height]);

  var svg = selectSVG(width, height); 
  var selectAll = appendSVG(svg);
  var enter = enterSVG(selectAll);
  var force = d3.layout.force().charge(-3000).gravity(0.65).linkDistance(20).size([width, height]);
  var zoomer = d3.behavior.zoom().scaleExtent([0.1,10]).x(xScale).y(yScale).on("zoom", redraw);
  var svg_graph = svg.append('svg:g').call(zoomer);
  var rect = setRectangleAttributes(svg_graph, width, height);

  setAttributes(enter);
 

  
  function redraw() {
    vis.attr("transform",
     "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
  }

  resize(width, svg, rect);

  d3.select(window).on("resize", resize); 
                                 

                                  var vis = svg_graph.append("svg:g");

                                  d3.json("graph.json", function(error, graph) {
                                    for (var i = 0; i < graph.nodes.length; i++) {
                                      graph.nodes[i].x = 500 + Math.sin(i) * 300;
                                      graph.nodes[i].y = 300 + Math.cos(i) * 150;
                                    }

                                    force.nodes(graph.nodes)
                                    .links(graph.links)
                                    .start();

                                    weight_max = Math.max.apply(null, graph.links.map(function(d) { return d.weight; })) / maxOpacity;

                                    var link = vis.selectAll(".link")
                                    .data(graph.links)
                                    .enter().append("path")
                                    .attr("class", "link")
                                    .attr("opacity", function(d) { return d.weight / weight_max; })
                                    .attr("stroke-width", node_r / 6);

                                    if (graph.directed) {
                                      link.attr("marker-end", "url(#end)");
                                    }

        // Rather than creating separate groups for text labels and nodes, 
        // this just hides the circle for the "real" nodes and uses a separate
        // circle for the visible circle, which is drawn first because it
        // is appended first here. There might be a better solution, but 
        // I'm not sure what it is, and this works well enough.
        var undernode = vis.selectAll(".undernode")
        .data(graph.nodes)
        .enter().append("g")
        .attr("class", "undernode")

        undernode.append("circle")
        .attr("r", node_r)

        id_label = undernode.append("text")
        .attr("class", "id-label")
        .attr("font-size", node_r)
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .text(function(d) { return d.id });

        var node = vis.selectAll(".node")
        .data(graph.nodes)
        .enter().append("g")
        .attr("class", "node");

        node.append("circle")
        .attr("r", node_r)
        .attr("opacity", 0)
        .on("click", circle_click);

        append_topic_label(node, 1);

        function append_topic_label(node, opacity) {
          label = node.append("text")
          .attr("class", "topic-click-label")
          .attr("font-size", node_r)
          .attr("x", node_r + 2)
          .attr("dy", ".35em")
          .attr("opacity", opacity)
          .text(function(d) { return d.name });
          return label
        }

        function circle_click() {
          var thisnode = d3.select(this.parentNode);
          var thislabel = thisnode.select(".topic-click-label");
          if (thislabel.empty()) {
            thislabel = append_topic_label(thisnode, 0);
            thislabel.transition(500).attr("opacity", 1);
          } else {
            thislabel.transition(500).attr("opacity", 0).remove();
          }
        }

        function link_arc(d) {
          var dx = d.target.x - d.source.x,
          dy = d.target.y - d.source.y,
          dr = Math.sqrt(dx * dx + dy * dy);
          return "M" + d.source.x + "," + d.source.y + 
          "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
        }

        function link_line(d) {
          return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
        }

        if (graph.directed) {
          link_path = link_arc
        } else {
          link_path = link_line
        }

        function transform(d) {
          return "translate(" + d.x + "," + d.y + ")";
        } 

        function tick() {
          link.attr("d", link_path);
          undernode.attr("transform", transform);
          node.attr("transform", transform);
        }

        for (var i = 0; i < 200 && force.alpha() > 0.009; i++) {
          force.tick();
        }

        force.on("tick", tick);

      });
}
