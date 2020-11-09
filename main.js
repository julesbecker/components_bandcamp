"use strict";

// import required modules
var topojson = require("topojson-client");
var d3 = require('d3');
var textwrap = require('d3-textwrap').textwrap;
var d3tip = require('d3-tip');
var colorLegend = require('d3-color-legend').legend;
var geoPolyhedralButterfly = require('d3-geo-polygon').geoPolyhedralButterfly;
d3.geoPolyhedralButterfly = geoPolyhedralButterfly;
d3.textwrap = textwrap;
d3.tip = d3tip;
d3.legend = colorLegend;

const network_data = require("./data/network_graph.json");
const world50 = require("./data/world50.json");
const countries = topojson.feature(world50, world50.objects.land);

// SECTION: prepare imported functions
var wrap = d3.textwrap().bounds({height: 175, width: 175});

const tip = d3.tip()
      .attr('class', "d3-tip")
      .style("color", "white")
      .style("padding", "6px")
      .offset([-15, 0])
      .html(function(d) {return `<div style='float: right'>${d}</div>`});

const zoom = d3.zoom()
    .translateExtent([[17, 100], [883, 580]])
    .extent([[17, 100], [883, 580]])
    .scaleExtent([1, 8])
      .on("zoom", function(event, d) {
        const { transform } = event;
        map.attr('transform', transform);
        let zoomscale = transform.k**.7;
          map.selectAll("circle")
          .attr('r', d => {
            let radiusval = 4;
            return radiusval / zoomscale;
          });
        }
    );

// set up dimensions for each svg
var height = 700;
var width = 900;

var cHeight = 900;
// var cWidth = 600;

// set up map assets
const geooutline = ({type: "Sphere"});
const projection = d3.geoPolyhedralButterfly()
    .translate([width / 2, (height / 2)-20])
    .precision(.1);

const path = d3.geoPath().projection(projection);

// SECTION: create svgs
let netviz = d3.select("#container")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${cHeight}`)
    .classed("svg-content", true)
      // .style("height", "100%")
      .attr("preserveAspectRatio", "xMinYMin meet");

const svg = d3.select("div#container")
    .append("svg")
    .attr("viewBox", `0 0 ${width-5} ${height-20}`)
    .classed("svg-content", true)
      // .style("height", 497)
      .attr("preserveAspectRatio", "xMinYMin meet");

// SECTION: setting up map...
const map = svg.append("g")
    .attr("id", "map");

map.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "black");

let lp_path = map.append("path")
    .datum(countries)
    .attr("id", "lp_path")
    .attr("fill", "white")
    .attr("d", path);

var customshape = `M0,700L233.92640648593908,329.99974719027483L170.64010748464213,293.46137520222373L125.88990164843437,267.6248420400352L81.1396984054818,241.78830015142614L17.853396810929667,205.2499368897957L81.13969840548174,168.71157362816518L125.88990164843432,142.87503173955602L170.64010748464204,117.03849857736752L233.92640648593894,80.50012658931637L233.92669840546478,80.50012658931635L297.21299740676176,117.03849857736746L341.9632032429694,142.87503173955594L386.71340648592206,168.71157362816504L449.9997080804742,205.2499368897955L450.0002919195258,205.2499368897955L513.2865935140779,168.71157362816507L558.0367967570305,142.875031739556L602.7870025932383,117.03849857736748L666.0733015945352,80.50012658931644L666.073593514061,80.50012658931638L729.359892515358,117.03849857736753L774.1100983515656,142.87503173955605L818.8603015945182,168.71157362816524L882.1466031890702,205.24993688979578L818.8603015945182,241.78830015142626L774.1100983515655,267.62484204003533L729.3598925153578,293.46137520222385L666.0735935140608,329.9997471902749L666.0733015945351,330.0002528097252L666.0732927406057,403.0769814503717L666.0733015945351,454.75006311020445L666.073301594535,506.4231468874228L666.073301594535,579.4998734106837L602.786999999983,542.9615101490532L558.0367967570304,517.1249682604441L513.2865997747522,491.2884197627998L450.00029191952575,454.7500631102044L449.9997080804742,454.75006311020445L386.7134002252477,491.2884197627998L341.9632032429695,517.1249682604441L297.2130000000169,542.9615101490532L233.92669840546483,579.4998734106837L233.92669840546483,506.4231468874227L233.9266984054648,454.75006311020445L233.92670725939428,403.0769814503717L233.92669840546478,330.00025280972517L233.9264064859390,329.9997471902748L0.000001,700L900,700L900,0L0,0L0,700Z`

svg.append("path")
    .attr("d", customshape)
    .attr("fill", "white");

svg.append("path")
    .attr("id", "butterflyborder")
    .datum(geooutline)
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke-width", 1)
    .attr("stroke", "black");

svg.append('text')
    .text("Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and")
    .attr("id", "explainer")
    .attr('x', 670)
    .attr('y', 345)
    .call(wrap);

svg.append('text')
    .style("font-family", "orion")
    .attr('class', 'cityname')
    .attr("font-size", "30px")
    .attr('x', width / 2 )
    .attr('y', height / 10 )
    .attr('text-anchor', 'middle');

const cityCircles = map.append("g");

const selectedShapes = cityCircles.selectAll("circles")
  .attr("id", "cityCircles")
  .data(network_data)
  //NOTE: Circle characteristics are set here
  .join("circle")
    .attr("transform", (d) => `translate(${projection(d.cor)})`)
    .attr("fill", "green")
    .attr("r", 4)
    .attr('opacity', .7)
    //NOTE: mouseover behavior determined here
    .on('mouseenter', function(event, d) {
        // show tooltip on mouse enter
        tip.show(d.ct, this);
        d3.select(this).attr('fill', "red");
    })
    .on('click', function(event, d) {
        svg.select(".cityname")
            .text(d.ct);
        d3.selectAll(".circSelect").attr("fill", "green").attr("opacity", .7);
        d3.selectAll("circle").classed('circSelect', false);
        d3.select(this).classed("circSelect", true).attr("fill", "red")
            .attr("opacity", 1);
        networkGenres(d);
    })
    .on('mouseout', function(event, d) {
        // hide tooltip on mouse out
        tip.hide();
        if (!this.classList.contains("circSelect")) {
            d3.select(this).attr('fill', "green");
        }

    });

// SECTION: netviz code
let drag = simulation => {

  function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
  }

  function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
  }

  function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
  }

  return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
}

function networkGenres(citydata) {
    // first, take just the entry that corresponds with the city
    // then, start parsing as appropriate
    let protonodes = citydata.n;
    let protolinks = citydata.l;

    const dlinks = protolinks.map(function(link) {
        const lw = d3.scaleSqrt()
            .domain([0, d3.max(protolinks, link => link.c)])
            .range([.01, 10]);
        var formattedLink = {};
        let linkwidth = lw(link['c']);
        formattedLink.source = link["g1"];
        formattedLink.target = link["g2"];
        // formattedLink.relationship = link["c"];
        formattedLink.value = linkwidth;
        return formattedLink;
    });

    let dnodes = protonodes.map(function(node) {
      const radius = d3.scaleSqrt()
          .domain([0, d3.max(protonodes, node => node.c)])
          .range([1, width / 50]);

        let noderadius = radius(node['c'])
        var formattedNode = {};
        formattedNode.genre = node["g"];
        formattedNode.count = node["c"];
        formattedNode.relative = node["r"];
        formattedNode.radius = noderadius;
        formattedNode.x = Math.max((noderadius), Math.min(width - (noderadius)));
        formattedNode.y = Math.max((noderadius), Math.min(width - (noderadius)));
        return formattedNode;
    });

    let cityLinks = dlinks.map(d => Object.create(d));
    let cityNodes = dnodes.map(d => Object.create(d));


    netviz.selectAll("g").remove();

    let statusColor = d3.scaleSequential([d3.min(cityNodes, d => d.relative), d3.max(cityNodes, d => d.relative)], d3.interpolateTurbo);

    const simulation = d3.forceSimulation(cityNodes)
        .force("link", d3.forceLink(cityLinks).id(d => d.genre))
        .force("charge", d3.forceManyBody().strength(-150).distanceMax(height/2))
        .force("center", d3.forceCenter(width/2, cHeight/2));

    const link = netviz.append("g")
        .attr("stroke", "#aaa")
        .attr("stroke-opacity", 0.3)
    .selectAll("line")
    .data(cityLinks)
    .join("line")
        .attr("stroke-width", d => d.value);

    const node = netviz.append("g")
      .attr("stroke", "#000")
    .selectAll("circle")
    .data(cityNodes)
    .join("circle")
    .attr("r", d => d.radius)
      .attr("fill", d => statusColor(d.relative))
      .call(drag(simulation))
    .on('mouseover.fade', fade(0.1))
    .on('mouseout.fade', fade(1));

    const textElems = netviz.append('g')
    .selectAll('text')
    .data(cityNodes)
    .join('text')
        .text(d => d.genre)
        .attr('class', "svgText")
        .attr('font-size',10);

    simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);
    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
    textElems
      .attr("x", d => d.x + d.radius + 2)
      .attr("y", d => d.y + 2 );
    });

    function fade(opacity) {
        return (event, d) => {
            node.style('opacity', function (o) { return isConnected(d, o) ? 1 : opacity });
            textElems.style('visibility', function (o) { return isConnected(d, o) ? "visible" : "hidden" });
            link.style('stroke-opacity', o => (o.source === d || o.target === d ? 1 : opacity));
            if(opacity === 1){
                node.style('opacity', 1)
                textElems.style('visibility', 'visible')
                link.style('stroke-opacity', 0.3)
            }
        };
    }

    const linkedByIndex = {};
    cityLinks.forEach(d => {
        linkedByIndex[`${d.source.index},${d.target.index}`] = 1;
    });

    function isConnected(a, b) {
        return linkedByIndex[`${a.index},${b.index}`] || linkedByIndex[`${b.index},${a.index}`] || a.index === b.index;
    }
}

// SECTION: call additional functions
svg.call(zoom);
map.call(tip);
