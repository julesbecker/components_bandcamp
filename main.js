"use strict";

// import required modules
var css = require('./static/css/style.css');
var topojson = require("topojson-client");
var d3 = require('d3');
var textwrap = require('d3-textwrap').textwrap;
var geoPolyhedralButterfly = require('d3-geo-polygon').geoPolyhedralButterfly;
d3.geoPolyhedralButterfly = geoPolyhedralButterfly;
d3.textwrap = textwrap;

const font = "cinetype";

const world50 = require("./data/world50.json");
const countries = topojson.feature(world50, world50.objects.land);
const network_data = require("./data/network_graph.json");
const genreAliases = require("./data/ng_ids.json")

// SECTION: shadow DOM and CSS imports
let root = document.querySelector("#map-container");
let shadow = root.attachShadow({ mode: "closed" });
let sourceDiv = document.createElement("div");
sourceDiv.setAttribute("id", "bandcamp-map");
shadow.appendChild(sourceDiv);

// dump CSS as a style tag inside the shadow DOM
const style = document.createElement("style");
style.innerHTML = css;
shadow.appendChild(style);

// ----- Pane wrappers

let mapWrap = document.createElement("div");
mapWrap.setAttribute("class", "svg-map-wrap active-map");
let vizWrap = document.createElement("div");
vizWrap.setAttribute("class", "svg-viz-wrap");

let mapSwitch = document.createElement("div");
mapSwitch.setAttribute("class", "map-switch");

mapSwitch.append(mapWrap);
mapSwitch.append(vizWrap);
sourceDiv.append(mapSwitch);

// ------- "Desktop viewing recommended" thing
let desktopViewing = "<div class='desktop-rec'><h2>Desktop Viewing Recommended</h2></div>"
mapWrap.innerHTML = desktopViewing;

// ----- Graph description block

let descText = 'The network graph shows all genres for a city that appear in at least 0.1% of the selected city’s albums or individually sold tracks, and that appear at least 100 times in the entire dataset. The strength of connections between nodes represents how often those genre tags co-occurred with one another on album and individual track pages. Genres were standardized wherever possible (e.g., "tekno" was corrected to "techno"), and all geographic genres, like "philly" and "Toronto", were removed if they appeared in the city in which the music was produced. A genre’s particularity to a city was calculated by dividing its proportion of total genres in that city to its average occurrence globally. The lines between each node represent how frequently genres co-occur in the same album or individually sold track.';
let vizTextInner = `
  <h1 class="viz-city-header"></h1>
  <div class="reveal-viz-about">About this graph</div>
  <div class="viz-details">
    <div class="hide-viz-about"></div>
    <h3>About this graph</h3>
    <p class="about-viz about">${descText}</p>
    <div class="legend-wrap">
      <div class="legend-single particularity-wrap">
        <h4>Particularity to city</h4>
      </div>
      <div class="legend-single appearances-wrap">
        <h4>Appearances</h4>
      </div>
    </div>
  </div>`;

let vizAboutBlock = document.createElement("div");
vizAboutBlock.setAttribute("class", "about-viz-wrap");
vizAboutBlock.innerHTML = vizTextInner;
vizWrap.append(vizAboutBlock);

// on mobile, button that opens the details section
vizAboutBlock.querySelector(".reveal-viz-about").addEventListener("click", () => {
  vizAboutBlock.querySelector(".viz-details").classList.add("modal");
  controls.style.zIndex = 1;
});

vizAboutBlock.querySelector(".hide-viz-about").addEventListener("click", () => {
  controls.style.zIndex = 1000;
  vizAboutBlock.querySelector(".viz-details").classList.remove("modal");
});

const zoom = d3.zoom()
    .translateExtent([[17, 100], [883, 580]])
    .extent([[17, 100], [883, 580]])
    .scaleExtent([1, 40])
      .on("zoom", function(event) {
        const { transform } = event;
        map.attr('transform', transform);
        let zoomscale = transform.k**.7;
          map.selectAll("circle")
          .attr('r', function() {
            let radiusval = 4;
            return radiusval / zoomscale;
          });
        }
    );

// set up dimensions for each svg
var height = 700;
var width = 920;
var cHeight = vizWrap.clientHeight;
var cWidth = vizWrap.clientWidth-vizAboutBlock.clientWidth;
// height = svgParent[0][0].clientHeight - margin.top - margin.bottom;

// set up map assets
const geooutline = ({type: "Sphere"});
const projection = d3.geoPolyhedralButterfly()
    .translate([width / 2, (height / 2)-20])
    .precision(.1);

const path = d3.geoPath().projection(projection);

const radius = d3.scaleSqrt()
    .domain([0, d3.max(network_data, city => city.city_count)])
    .range([1, width / 50]);

// SECTION: prepare imported data

//is this nodes,
network_data.map((d) => { d.radius = radius(d.c); });

// SECTION: create svgs

const svg = d3.select(mapWrap)
    .append("svg")
    .attr("id", "svg1")
    .attr("viewBox", `5 70 ${width} ${height-175}`)
    .classed("svg-map", true)
    // .classed("svg-content", true)
      .attr("preserveAspectRatio", "xMidYMid meet");

let nv_svg = d3.select(vizWrap)
    .append("svg")
    .attr("id", "nv_svg")
    .attr("width", cWidth);

let legendWrap = sourceDiv.querySelector(".legend-wrap");
let partic = {w: 200, h: 90};
let legend_svg = d3.select(legendWrap.querySelector(".particularity-wrap")).append("svg")
    .attr("viewBox", `0 0 ${partic.w} ${partic.h}`)
    .attr("width", partic.w)
    .attr("height", partic.h)
    .attr("class", "legend-svg")
    .attr("preserveAspectRatio", "xMinYMin meet");

let appearDim = { w: 150, h: 110 }; //previously 400x400
let legend_svg2 = d3.select(legendWrap.querySelector(".appearances-wrap")).append("svg")
    .attr("width", appearDim.w)
    .attr("height", appearDim.h)
    .attr("class", "legend-svg")
    .style("height", "100%")
    .attr("preserveAspectRatio", "xMinYMin meet");

nv_svg.append("rect")
    .attr("id", "nvbg")
    .attr("width", cWidth)
    .attr("height", cHeight)
    .attr("fill", "white");

let netviz = nv_svg.append('g');

let mapsvg = svg.append("g");

let mapgroup = svg.append("g").attr("id", "mapgroup").attr("transform", 'translate(10,0)');
// SECTION: setting up map...
const map = mapsvg.append("g")
    .attr("id", "map");

map.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "black");

map.append("path")
    .datum(countries)
    .attr("id", "lp_path")
    .attr("fill", "white")
    .attr("d", path);

var customshape = `M0,700L233.92640648593908,329.99974719027483L170.64010748464213,293.46137520222373L125.88990164843437,267.6248420400352L81.1396984054818,241.78830015142614L17.853396810929667,205.2499368897957L81.13969840548174,168.71157362816518L125.88990164843432,142.87503173955602L170.64010748464204,117.03849857736752L233.92640648593894,80.50012658931637L233.92669840546478,80.50012658931635L297.21299740676176,117.03849857736746L341.9632032429694,142.87503173955594L386.71340648592206,168.71157362816504L449.9997080804742,205.2499368897955L450.0002919195258,205.2499368897955L513.2865935140779,168.71157362816507L558.0367967570305,142.875031739556L602.7870025932383,117.03849857736748L666.0733015945352,80.50012658931644L666.073593514061,80.50012658931638L729.359892515358,117.03849857736753L774.1100983515656,142.87503173955605L818.8603015945182,168.71157362816524L882.1466031890702,205.24993688979578L818.8603015945182,241.78830015142626L774.1100983515655,267.62484204003533L729.3598925153578,293.46137520222385L666.0735935140608,329.9997471902749L666.0733015945351,330.0002528097252L666.0732927406057,403.0769814503717L666.0733015945351,454.75006311020445L666.073301594535,506.4231468874228L666.073301594535,579.4998734106837L602.786999999983,542.9615101490532L558.0367967570304,517.1249682604441L513.2865997747522,491.2884197627998L450.00029191952575,454.7500631102044L449.9997080804742,454.75006311020445L386.7134002252477,491.2884197627998L341.9632032429695,517.1249682604441L297.2130000000169,542.9615101490532L233.92669840546483,579.4998734106837L233.92669840546483,506.4231468874227L233.9266984054648,454.75006311020445L233.92670725939428,403.0769814503717L233.92669840546478,330.00025280972517L233.9264064859390,329.9997471902748L0.000001,700L900,700L900,0L0,0L0,700Z`

mapgroup.append("path")
    .attr("d", customshape)
    .attr("fill", "white");

svg.append("rect")
    .attr("x", -980)
    .attr("height", height)
    .attr("width", 1000)
    .attr("fill", "white");

svg.append("rect")
    .attr("x", 895)
    .attr("height", height)
    .attr("width", 1000)
    .attr("fill", "white");

var legend = legend_svg.append('g')
    .attr("id", "legend");

var legendBar = legend.append('g');

var legendCircle = legend_svg2.append('g');

let less = legend.append("text")
    .attr("id", "less")
    .attr("fill", "white")
    .attr("font-family", font)
    .attr('font-size', "14px")
    .attr("x", 10)
    .attr("y", 50);

let more = legend.append("text")
    .attr("id", "more")
    .attr("fill", "black")
    .attr("font-family", font)
    .attr('font-size', "14px")
    .attr("x", 150)
    .attr("y", 50);

legend.append("rect")
    .attr("x", 70)
    .attr("y", 43)
    .attr("height", 2)
    .attr("width", 55)
    .attr("fill", "white")

svg.append("path")
    .datum(geooutline)
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke-width", 1)
    .attr("stroke", "black");

var wrap = d3.textwrap().bounds({height: 250, width: 200});
var wrap2 = d3.textwrap().bounds({height: 500, width: 220});

let cityName = svg.append("text")
    .attr("x", width/2+6)
    .attr("y", 115)
    .style("font-weight", 600)
    .attr("text-anchor", 'middle')
    .style("font-family", font)
    .style("font-size", "34px")
    .text("");

let countryName = svg.append("text")
    .attr("x", width/2+5)
    .attr("y", 150)
    .attr("text-anchor", 'middle')
    .style("font-family", font)
    .style("font-size", "24px")
    .text("");

let ggg = svg.append("g");

ggg.append("text")
    .attr("x", 7)
    .attr("y", 320)
    .text("Click on a")
    .call(wrap2);

ggg.select("foreignObject")
    .attr('class', "map-instruction");

ggg.append("text")
    .attr("x", 7)
    .attr("y", 565)
    .text("city")
    .attr('class', "map-instruction")
    .attr("fill", "blue")
    ;

let hhh = svg.append("g");

hhh.append('text')
    .text("This map marks cities with at least 500 albums or individual tracks sold between August 19 and November 10, 2020 on Bandcamp.")
    .attr('x', 685)
    .attr('y', 340)
    .call(wrap);

hhh.select("foreignObject")
    .attr("class", "about-map")
    .attr('font-size', 22);

svg.append('text')
    .attr('x', 15)
    .attr('y', 15)
    .attr("class", "mobilenote")
    .attr('font-size', 20)
    .text("Note: Viewing on a large screen is recommended");

const cityCircles = map.append("g");
let citydata;

cityCircles.selectAll("circles")
  .data(network_data)
  //NOTE: Circle characteristics are set here
  .join("circle")
    .attr("transform", (d) => `translate(${projection(d.cor)})`)
    .attr("fill", d3.rgb(3, 90, 252))
    .attr("r", 4)
    .attr('opacity', .7)
    //NOTE: mouseover behavior determined here
    .on('mouseenter', function(event, d) {
        let array = d.ct.split(/,\s(?=[^,]+$)/);
        if (array[1] != null) {
          cityName.text(array[0]+',');
          countryName.text(array[1]);
        }
        else {
          cityName.text(array[0]);
        }
        d3.select(this).attr('fill', "red");
    })
    .on('click', function(event, d) {
        vizAboutBlock.querySelector(".viz-city-header").innerText = d.ct;
        citydata = d;
        cityCircles.selectAll("circle").classed('circSelect', false);
        d3.select(this).classed("circSelect", true);
        networkGenres(d);
        switchViews("viz");
    })
    .on('mouseout', function() {
        cityName.text("");
        countryName.text("");
        d3.select(this).attr('fill', d3.rgb(3, 90, 252));
    });

// SECTION: netviz code
let drag = simulation => {
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}

function getVizDimensions() {
  let cWidth, cHeight;
  if (window.innerWidth > 750) {
    cHeight = vizWrap.clientHeight;
    cWidth = vizWrap.clientWidth-vizAboutBlock.clientWidth;
  } else {
    cHeight = window.innerHeight - controls.clientHeight - vizAboutBlock.clientHeight;
    cWidth = window.innerWidth;
    if (cHeight < cWidth) {
      cHeight = window.innerHeight;
    }
  }

  let obj = {w: cWidth, h: cHeight}
  return obj;
}

function networkGenres(citydata) {
    // base size variables
    let cHeight, cWidth;
    let cDims = getVizDimensions();
    cHeight = cDims.h; cWidth = cDims.w;

    let cArea = cHeight*cWidth;

    // consider adding a "prop" modifier to other variables, to account for the length-width issues
    let cProp = d3.min([cHeight, cWidth])/d3.max([cHeight, cWidth]);
    let cHyp = Math.hypot(cHeight, cWidth)

    // variables for netviz rendering
    let maxNodeSize = cArea / 15000;
    let linkwidthMax = cHyp/115;
    let smallLabel = cHyp/120;
    let bigLabel = smallLabel*2.15;
    let forceStrength = -(cHyp/3.4);
    let distMax = cHyp/6;

    let protonodes = citydata.n;
    let protolinks = citydata.l;

    const dlinks = [];
    protolinks.map(function(link) {
        link["ts"].map(function(target) {
            let source = link["s"];
            const lw = d3.scaleSqrt()
                .domain([0, citydata['w']])
                .range([.01, linkwidthMax]);
            // if target's count > 4% of largest link in the set, add the connection
            if (target['c'] > citydata['w']*.004) {
                var formattedLink = {};
                let linkwidth = lw(target['c']);

                formattedLink.source = source;
                formattedLink.target = target["t"];
                formattedLink.value = linkwidth;
                dlinks.push(formattedLink);
            }
        })
    });

    let dnodes = protonodes.map(function(node) {
        const radius = d3.scaleSqrt()
            .domain([0, d3.max(protonodes, node => node.c)])
            .range([.75, maxNodeSize]);
        let noderadius = radius(node['c'])
        var formattedNode = {};
        let genre = genreAliases[node["g"]];
        formattedNode.genre = genre
        formattedNode.id = node['g'];
        formattedNode.count = node["c"];
        formattedNode.relative = node["r"];
        formattedNode.radius = noderadius;
        // formattedNode.y = Math.max((noderadius), Math.min(width - (noderadius)));
        return formattedNode;
    });

    let cityLinks = dlinks.map(d => Object.create(d));
    let cityNodes = dnodes.map(d => Object.create(d));

    let n = cityNodes.length;

    let linkdistance = cArea/(6750*(n/100)); // add modifier based on number of nodes

    cityNodes.forEach(function(d, i) {
      d.x = cWidth / n * i;
    });

    netviz.selectAll("g").remove();

    netviz.select("rect#nvbg")
        .on('click', fade(1));

    function composition(f, g) { return t => f(g(t)); }
    let custominterpolation = composition(d3.interpolateRgbBasis(["#4d3d95", "#3ab1b2", "#fcff00"]), t=>t**.8) //rgb(255, 255, 77)
    let statusColor = d3.scaleSequential([0, d3.max(cityNodes, d => d.relative)], custominterpolation);

    function drawScale() {
        var barDefs = legendBar.append('defs');

        var mainGradient = barDefs.append('linearGradient')
            .attr('id', 'mainGradient');

        mainGradient.append('stop')
            .attr('class', 'stop-left')
            .attr('offset', '0');

        mainGradient.append('stop')
            .attr('class', 'stop-center')
            .attr('offset', .5**.75);

        mainGradient.append('stop')
            .attr('class', 'stop-right')
            .attr('offset', 1**.75);

        legendBar.append('rect')
            .classed('filled', true)
            .attr('y', 30)
            .attr('height', 30)
            .attr('width', 200);

        less.text("LESS");
        more.text("MORE");
      }

    function drawNodeLegend() {

      legendCircle.selectAll("g").remove();
        // use scaling function
        let biggestNode = d3.max(cityNodes, d => d.count);
        function circleLegend(selection) {

            let instance = {}
            function round(n) {return Math.ceil((n+1)/5)*5}
            // set some defaults
            const api = {
                domain: [0, biggestNode], // the values min and max
                range: [0, maxNodeSize], // the circle area/size mapping
                values: [round(biggestNode/21), round(biggestNode/3), round(biggestNode)], // values for circles
                width: appearDim.w-30,
                height: appearDim.h-20,
                suffix:'', // ability to pass in a suffix
                circleColor: '#888',
                textPadding: 30,
                textColor: '#454545'
            }

            const powScale = d3.scalePow()
                .domain(api.domain)
                .range(api.range);

            const sqrtScale = d3.scaleSqrt()
                .domain(api.domain)
                .range(api.range);

            instance.render = function () {

                const s = selection.append('g')
                    .attr('class', 'legend-wrap')
                    // push down to radius of largest circle
                    .attr('transform', 'translate(0,' + sqrtScale(d3.max(api.values)) + ')')

                // append the values for circles
                s.append('g')
                    .attr('class', 'values-wrap')
                    .selectAll('circle')
                    .data(api.values)
                    .enter().append('circle')
                    .attr('class', d => 'values values-' + d)
                    .attr('r', d => sqrtScale(d))
                    .attr('cx', api.width/2)
                    .attr('cy', d => api.height/1.5 - sqrtScale(d))
                    .style('fill', 'none')
                    .style('stroke', api.circleColor)

                // append some lines based on values
                s.append('g')
                    .attr('class', 'values-line-wrap')
                    .selectAll('.values-labels')
                    .data(api.values)
                    .enter().append('line')
                    .attr('x1', d => api.width/2 + sqrtScale(d))
                    .attr('x2', d => api.width/2 + sqrtScale(api.domain[1]) + 16 - d.toString().length*3)
                    .attr('y1', d => api.height/1.5 - powScale(d)-10)
                    .attr('y2', d => api.height/1.5 - powScale(d)-10)
                    .style('stroke', api.textColor)
                    .style('stroke-dasharray', ('2,2'))

                // append some labels from values
                s.append('g')
                    .attr('class', 'values-labels-wrap')
                    .selectAll('.values-labels')
                    .data(api.values)
                    .enter().append('text')
                    .attr('x', api.width/2 + sqrtScale(api.domain[1]) + api.textPadding)
                    .attr('y', d => (api.height/1.5 - powScale(d) - 7))
                    .attr('shape-rendering', 'crispEdges')
                    .style('text-anchor', 'end')
                    .style('fill', api.textColor)
                    .style("font-family", font)
                    .attr('font-size', 10)
                    .text(d => d + api.suffix);

                return instance
            }

            for (let key in api) {
                instance[key] = getSet(key, instance).bind(api)
            }

            return instance

            // https://gist.github.com/gneatgeek/5892586
            function getSet(option, component) {
                return function (_) {
                    if (! arguments.length) {return this[option];}
                this[option] = _;
                return component;
              }
            }
        }
        var l = circleLegend(legendCircle)
        l.render()
      }

    drawNodeLegend();
    drawScale([d3.min(cityNodes, d => d.relative).toString(), d3.max(cityNodes, d => d.relative).toString()], custominterpolation);

    const simulation = d3.forceSimulation(cityNodes)
        .force("link", d3.forceLink(cityLinks).id(d => d.id)
            .distance([linkdistance]))
        .alphaDecay([.09])
        .velocityDecay([.15])
        .force("charge", d3.forceManyBody().strength(forceStrength).distanceMax(distMax))//.strength(-100).distanceMax(220))
        .force("center", d3.forceCenter(cWidth/2, cHeight/2).strength(1.25))
        .force("collide", d3.forceCollide().radius(d => d.r + 2).strength(2));

    if (cHeight < cWidth) {
      let yforce = Math.sqrt(1-cProp)/9;
      simulation.force("x", d3.forceX().strength(0))
          .force("y", d3.forceY().strength(yforce));
    }
    else {
        let xforce = Math.sqrt(1-cProp)/4;
        simulation.force("y", d3.forceY().strength(.02))
            .force("x", d3.forceX().strength(xforce));
    }

    function cleanName(str) {
        return str.replace(/ |\/|&|!|\*|\(|\)/gi, "_").replace(/^(?=\d)/gi, "_")
    }

    const link = netviz.append("g")
        .attr("stroke", "#aaa")
        .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(cityLinks)
    .join("line")
        .attr("stroke-width", d => d.value);

    var labelscale = d3.scaleLinear()
      .domain([0, d3.max(cityNodes, city => city.radius)])
      .range([smallLabel, bigLabel]);

    const node = netviz.append("g")
        .attr("stroke", "#000")
        .selectAll("circle")
        .data(cityNodes)
        .join("circle")
        .attr("r", d => d.radius)
          .attr("fill", d => statusColor(d.relative))
          .call(drag(simulation))
        .on('mouseover.fade', fade(0.1))
        .on("mouseenter", (event, d) => {
          let prepped_name = cleanName(d.__proto__.genre)
          netviz.selectAll(`#${prepped_name}`).attr("opacity", 1);
        })
        .on('mouseout.fade', fade(1))
        .on("mouseout", (event, d) => {
          let prepped_name = cleanName(d.__proto__.genre)
          netviz.selectAll(`#${prepped_name}`).attr("opacity", 0);
        });

    const textElems = netviz.append('g')
        .selectAll("text")
        .data(cityNodes)
        .join('text')
            .text(d => d.genre)
            .attr('class', "svgText")
            .attr("dominant-baseline", "middle")
            .attr('font-size', d => labelscale(d.radius));

    let qqq = netviz.append('g');
    const otherText = netviz.append('g')
        .selectAll("text")
        .data(cityNodes)
        .join('text')
            .text(d => d.genre)
            .attr("id", d => cleanName(d.genre))
            .attr('class', "svgText")
            .attr("dominant-baseline", "middle")
            .attr("fill", "white")
            .style("font-weight", 700)
            .attr('font-size', d => labelscale(d.radius))
            .attr("opacity", 0);

    cityNodes.forEach(function(d) {
        let textBounds = netviz.select(`text#${cleanName(d.__proto__.genre)}`).node().getBBox();
        d.textbox = [textBounds.width, textBounds.height];
    });

    const textBoxes = qqq.append('g')
        .selectAll("rect")
        .data(cityNodes)
        .join('rect')
            .attr("id", d => cleanName(d.genre))
            .attr("width", d => d.textbox[0] + 6)
            .attr('height', d => d.textbox[1] + 5)
            .attr('class', "svgText")
            .attr("fill", "blue")
            .attr('transform', function() {
              return `translate(0, -${this.getAttribute('height') / 2})`;
            })
            .attr("opacity", 0);

    simulation.on("tick", () => {

        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
        node
            .attr("cx", d => { return d.x = Math.max(d.radius+10, Math.min(cWidth - (d.radius+30), d.x)); })
            .attr("cy", d => { return d.y = Math.max(d.radius+5, Math.min(cHeight - (d.radius+5), d.y)); });

        textElems
            .attr("x", d => d.x + d.radius + 5)
            .attr("y", d => d.y);
        otherText
            .attr("x", d => d.x + d.radius + 5)
            .attr("y", d => d.y);
        textBoxes
            .attr("x", d => d.x + d.radius + 2)
            .attr("y", d => d.y);
    });

    function fade(opacity) {
        return (event, d) => {
            node.style('opacity', function (o) { return isConnected(d, o) ? 1 : opacity });
            textElems.style('visibility', function (o) { return isConnected(d, o) ? "visible" : "hidden" });
            link.style('stroke-opacity', o => (o.source === d || o.target === d ? 1 : opacity));
            if(opacity === 1){
                node.style('opacity', 1)
                textElems.style('visibility', 'visible')
                d3.select()
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

map.selectAll("rect")
    .on('click', function() {
        cityCircles.selectAll("circle").classed('circSelect', false);
        netviz.selectAll("g").remove();
        netviz.select("foreignObject").remove();
      })

// SECTION: call additional functions
mapsvg.call(zoom);

// tabs for switching between sections
let tabsTemplate = `
    <div class="single-tab text-tab"><span>Back to text</span></div>
    <div class="single-tab map-tab"><span>Back to map</span></div>
    <div class="single-tab graph-tab"><span>Back to graph</span></div>
    <div class="single-tab regenerate-nodes disabled disabled-on-map">
      <span>Redraw Nodes</span>
    </div>
`;
let controls = document.createElement("div");
controls.setAttribute("class", "map-tabs-parent");
controls.innerHTML = tabsTemplate;
sourceDiv.appendChild(controls);

let mapTab = controls.querySelector(".single-tab.map-tab");
let graphTab = controls.querySelector(".single-tab.graph-tab");
let exitTab = controls.querySelector(".single-tab.text-tab");

mapTab.addEventListener("click", (e) => {
  switchViews("map");
});

graphTab.addEventListener("click", (e) => {
  switchViews("viz");
});

// emit an event when someone clicks on "back to text," or presses ESC
// needed for the site, not for the map itself
const exitEvent = new Event('exit');

exitTab.addEventListener("click", (e) => {
  root.dispatchEvent(exitEvent);
});

document.addEventListener("keydown", (e) => {
  if (e.key == "ArrowLeft") {
    switchViews("map");
  } else if (e.key == "ArrowRight") {
    switchViews("viz");
  } else if (e.key == "Escape") {
    if (vizAboutBlock.querySelector(".viz-details").classList.contains("modal")) {
      vizAboutBlock.querySelector(".viz-details").classList.remove("modal");
      controls.style.zIndex = 1000;
    } else {
      root.dispatchEvent(exitEvent);
    }
  }
});

function switchViews(toView) {
  console.log(toView);
  if (toView == "viz") {
    hasVizBeenOpenedOnce = true;
    graphTab.classList.remove("current");
    mapTab.classList.add("current");

    vizWrap.classList.add("active-map");
    mapWrap.classList.remove("active-map");
    buttn.classList.remove("disabled-on-map");
    resizeViz();
  } else if (toView == "map") {
    graphTab.classList.add("current");
    mapTab.classList.remove("current");

    vizWrap.classList.remove("active-map");
    mapWrap.classList.add("active-map");
    buttn.classList.add("disabled-on-map");
  } else {
    console.log("needs to be either 'viz' or 'map'!")
  }
}


let buttn = controls.querySelector(".regenerate-nodes");
// console.log(buttn);

buttn.addEventListener("click", () => {
  networkGenres(citydata);
  buttn.classList.add("disabled");
});

let hasVizBeenOpenedOnce = false;

window.addEventListener("resize", function() {
  if (hasVizBeenOpenedOnce) {
    buttn.classList.remove("disabled");
  }

  resizeViz();
});

document.addEventListener("enter", function() {
  buttn.classList.add("disabled-on-map");
  controls.style.zIndex = 1000;
})

function resizeViz() {
  let cDims = getVizDimensions();
  nv_svg.attr("width", cDims.w).attr("height", cDims.h);
}

// window.mobileCheck = function() {
//   let check = false;
//   (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
//   return check;
// };

// emit an event when fully loaded
root.dispatchEvent(new Event("externalLoaded"));
