"use strict";

var d3 = require('d3');
var textwrap = require('d3-textwrap').textwrap;
var d3tip = require('d3-tip');
var dataprep = require('./data_prep');
var geoPolyhedralButterfly = require('d3-geo-polygon').geoPolyhedralButterfly;
d3.textwrap = textwrap;
d3.tip = d3tip;
d3.geoPolyhedralButterfly = geoPolyhedralButterfly;

console.log("data", data)

var wrap = d3.textwrap().bounds({height: 175, width: 175});

const bMargin = 50

const cMargin = ({top: 150, right: 50, bottom: 30, left: 50})

const tip = d3.tip()
  .attr('class', "d3-tip")
  .style("color", "white")
  .style("padding", "6px")
  .offset([-10, 0])
  .html(function(d) {return `<div style='float: right'>${d.place}</div>`});

function responsivefy(svg) {
    // get container + svg aspect ratio
    var container = d3.select(svg.node().parentNode),
        width = parseInt(svg.style("width")),
        height = parseInt(svg.style("height")),
        aspect = width / height;

    // add viewBox and preserveAspectRatio properties,
    // and call resize so that svg resizes on inital page load
    svg.attr("viewBox", "0 0 " + width + " " + height)
        .attr("perserveAspectRatio", "xMinYMid")
        .call(resize);

    // to register multiple listeners for same event type,
    // you need to add namespace, i.e., 'click.foo'
    // necessary if you call invoke this function for multiple svgs
    // api docs: https://github.com/mbostock/d3/wiki/Selections#on
    d3.select(window).on("resize." + container.attr("id"), resize);

    // get width of container and resize svg to fit it
    function resize() {
        var targetWidth = parseInt(container.style("width"));
        svg.attr("width", targetWidth);
        svg.attr("height", Math.round(targetWidth / aspect));
    }
}

var height = 700;
var width = 900;

var cHeight = 500;
var cWidth = 800;
var specs = {
  "c_h": cHeight*.6
};

let rendSwitch = 0;

const geooutline = ({type: "Sphere"});
const projection = d3.geoPolyhedralButterfly()
    .translate([width / 2, (height / 2)-20])
    .precision(.1);

const path = d3.geoPath()
    .projection(projection);

const radius = d3.scaleSqrt()
    .domain([0, d3.max(data, city => city.total_no)])
    .range([1, width / 50]);

data.map((d) => { d.radius = radius(d.total_no); });

const svg2 = d3.select("body")
    .append("svg")
    .style("width", `${cWidth}px`) //need "px" after the number for Firefox
    .style("height", `${cHeight}px`)
    .call(responsivefy);

const svg = d3.select("body")
    .append("svg")
      .style("width", `${width}px`) //need "px" after the number for Firefox
      .style("height", `${height}px`)
      .call(responsivefy);

// map.append('image')
//     .attr('xlink:href', 'map-2000-edit_reduced.png')
//     .attr("x", 16.5)
//     .attr("y", .45)
//     .attr('width', width-33.5)
//     .attr('height', height-45.8)

const map = svg.append("g")
    .attr("id", "map");

map.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "black");

map.append("path")
    .datum(topojson.feature(world50, world50.objects.land))
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
    .text("Relative")
    .attr("id", "es")
    .attr("transform", `rotate(-30)`)
    .attr('class', 'displayopt')
    .attr('fill', 'red')
    .attr('x', 20)
    .attr('y', 180)
    .on('click', function() {
        buttonvalue = 1;
        d3.select("#cs")
          .attr("fill", "black");
        cityCircles.call(drawCircles, 1);
        if(rendSwitch == 1) {updateBars(placeHold, relHold)};
        d3.select(this)
          .attr('fill', 'red');
      });

  svg.append('text')
      .text("Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and")
      .attr("id", "li")
      .attr('fill', 'red')
      .attr('x', 670)
      .attr('y', 345)
      .call(wrap);

svg.append('text')
    .text("Absolute")
    .attr("id", "cs")
    .attr('class', 'displayopt')
    .attr("transform", `rotate(30)`)
    .attr('x', 350)
    .attr('y', -55)
    .on('click', function() {
        buttonvalue = 2;
        if(rendSwitch == 1) {updateBars(placeHold, absHold)};
        d3.select("#es")
          .attr("fill", "black");
        d3.select(this)
          .attr('fill', 'red');
        cityCircles.call(drawCircles, 2);
      });

// SECTION: setting up chart...
const chart = svg2.append("g")
    // .attr("transform", `translate(0, ${specs["c_h"]-160}) `);

chart.append("g")
    .attr("stroke-opacity", .9)
    .attr("id", "chartlabel")
    .append('text')
      .text('CITIES AND THEIR VALUES')
      .style("font-family", "orion")
      .attr('class', 'title')
      .classed("axis", true)
      .attr("font-size", "30px")
      .attr('x', cWidth / 2 )
      .attr('y', cHeight / 10 )
      .attr('text-anchor', 'middle');

chart.append("g")
    .attr("id", "y_axis");

let nullset = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

let absHold = nullset;
let relHold = nullset;
let placeHold = "";

let xScale = d3.scaleBand()
    .domain(d3.range(nullset.length))
    .rangeRound([cMargin.left, cWidth - cMargin.right])
    .padding(0.1);

let yScale = d3.scaleLinear()
    .domain([0, d3.max(nullset)]).nice()
    .range([1.75 * cMargin.top, cMargin.bottom]);

chart.append("g")
    .attr("id", "x_axis");

chart.append("g")
    .attr("id", "bars")
    .selectAll("rect")
    .data(nullset)
    .enter()
    .append("rect")
      .attr("x", (data, i) => xScale(i))
      .attr("y", data => yScale(data))
      .attr("rx", 1)
      .attr("fill-opacity", 0.6);

function updateBars(place, bars) {
    let searchval = "relative";
    if(buttonvalue != 1) {searchval = "count"};

    let scene = new Map();
    bars.map(value => {scene.set(value.genre, value[searchval])});
    let scenemax = bars[0][searchval];
    var t = d3.transition()
        .duration(600)
        .ease(d3.easePolyInOut.exponent(4));

    let yScale = d3.scaleLinear()
        .domain([scenemax, 0]).nice()
        .range([cHeight - cMargin.bottom, cMargin.top]);

    let yAxis = g => g
        .attr("transform", `translate(${cMargin.left},0)`)
        .transition(t)
        .call(d3.axisLeft(yScale));

    let xScale = d3.scaleBand()
      .domain([...scene.keys()])
      .range([cMargin.left, cWidth - cMargin.right])
      .padding(0.1);

    let xAxis = function(g) {
      g.call(d3.axisTop(xScale)
          .tickSizeOuter(0));
    }

    var xwrap = d3.textwrap().bounds({height: 25, width: 25});


    chart
        .select("g#x_axis")
        .attr("class", "axis")
        .attr("transform", `translate(0,${cMargin.top})`)
        .transition(t).duration(500)
        .call(xAxis)
        .selectAll("text")
            // .call(xwrap)
            .style("font-family", "cinetype")
            .style("text-anchor", "start")
            .attr("transform", `rotate(-40)`);

    // var xtext = chart.selectAll('text');
    // xtext.call(xwrap);


    chart
        .select("g#y_axis")
        .attr("class", "axis")
        .call(yAxis);

    chart
        .select("g#chartlabel")
        .select("text")
        .text(place);

    let scenearray = [];

    scene.forEach((v, k) => scenearray.push({x:[k], y:v}));

    // function ggg(scenearray) {return yScale(0) - yScale(scenearray.y)}
    // console.log("data => yScale(0) - yScale(data.y)", ggg(scenearray))

    chart.selectAll("rect")
        .data(scenearray)
        .transition() // <---- Here is the transition
        .duration(500) // .5 seconds
        .attr("fill", "red") //(d) => genreColors(d.x)
        .attr("x", data => xScale(data.x))
        .attr("y", cMargin.top)
        .attr("width", xScale.bandwidth())
        .attr("height", data => yScale(data.y) - yScale(0));
}

map.call(tip);

let buttonvalue = 1;

let zoomscale = 1;
function drawCircles(selection, n) {
  let circleR = 5;
  if (n != "1") {
    buttonvalue = 2;
    selectedShapes.each(function() {
      d3.select(this)
      .attr('r', null)
    });
    circleR = selectedShapes.each(function() {
      d3.select(this)
          .attr("r", d => radius(d.total_no) / zoomscale);
    });
  }
  else {
    buttonvalue = 1;
    circleR = 5;
    selectedShapes.each(function() {
      d3.select(this)
      .attr('r', null)
    });
    selectedShapes.each(function() {
      d3.select(this)
        .attr("r", 4 / zoomscale);
    })
  };
}

const cityCircles = map.append("g");

const selectedShapes = cityCircles.selectAll("circles")
  .attr("id", "cityCircles")
  .data(data)
  //ANDREW: Circle characteristics are set here
  .join("circle")
    .attr("transform", (d) => `translate(${projection(d.coords)})`)
    .attr("fill", "green")
    .attr('opacity', .7)
    //NOTE: mouseover behavior determined here
    .on('mouseenter', function(event, d) {
      // show tooltip on mouse enter
      tip.show(d, this);
      console.log(" d", d);
      console.log("this", this);
      d3.select(this).attr('fill', "red");
    })

    .on('click', function(event, d) {
        let bars = null;
        if(rendSwitch == 0) {rendSwitch = 1};
            console.log(" d", d);

            bars = d.rel_bars.slice(0,24);
            absHold = d.abs_bars.slice(0,24);
            relHold = d.rel_bars.slice(0,24);
            placeHold = d.place;
            d3.selectAll(".circSelect").attr("fill", "green").attr("opacity", .7);
            d3.selectAll("circle").classed('circSelect', false);
            d3.select(this).classed("circSelect", true).attr("fill", "red")
            .attr("opacity", 1);
      if(buttonvalue != 1) {bars = d.abs_bars.slice(0,24)};
      updateBars(placeHold, bars); //Updates the bar chart
    })
    .on('mouseout', function(event, d) {
      // hide tooltip on mouse out
      tip.hide();
      if($(this).attr("class") != "circSelect") {d3.select(this).attr('fill', "green")}
    });

// SECTION: Load circle toggle

d3.select(window).on("load", function() {
    cityCircles.call(drawCircles, buttonvalue);
});

// SECTION: Styling for the svg
d3.selectAll(".displayopt")
    .style("font-family", "orion")
    .style("text-anchor", "middle")
    .on('mouseover', function(d, i) {
        d3.select(this)
          .style('font-weight', 'bold');
      })

    .on('mouseout', function(d, i) {
        d3.select(this)
          .style('font-weight', '');
      });

const zoom = d3.zoom()
    .translateExtent([[17, 100], [883, 580]])
    .extent([[17, 100], [883, 580]])
    .scaleExtent([1, 8])
    .on("zoom", function(event, d) {
        const { transform } = event;
        map.attr('transform', transform);
        map.selectAll("circle")
            .attr('r', d => {
              let radiusval = 4;
              buttonvalue != 1 ? radiusval=d.radius: radiusval=4;
              zoomscale = transform.k**.7;
              return radiusval / zoomscale;
            });
        }
    );

let zoomed = svg.call(zoom)
