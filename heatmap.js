"use strict";

// import required modules
var d3 = require('d3');
var d3tip = require('d3-tip');
d3.tip = d3tip;

// SECTION: prepare imported functions
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
        zoomscale = transform.k**.7;
        if(buttonvalue == 0) {
          borders.selectAll(".flowline")
          .attr("stroke-width", d => {
            return 2 / zoomscale;
          });
        }
        else {
          map.selectAll("circle")
          .attr('r', d => {
            let radiusval = 4;
            buttonvalue != 1 ? radiusval=d.radius: radiusval=4;
            return radiusval / zoomscale;
          });
        };
        }
    );

let heatmap = d3.select("#container")
    .append("svg")
    .style("height", 1600)
    .style("width", 1600);

//Read the data
d3.csv("./heatmap.csv").then((data) => {
    // Labels of row and columns -> unique identifier of the column called 'group' and 'variable'

    let country_counts = new Array();

    function search(nameKey, myArray){
      for (var i=0; i < myArray.length; i++) {
          if (myArray[i].from_country === nameKey) {
              return myArray[i];
          }
      }
    }
    for (var i=0; i < data.length; i++) {
        // console.log("data[i].from_country", data[i].from_country)
        let entry = search(data[i].from_country, country_counts);
        // console.log("entry", entry)
        if (entry === undefined) {
            country_counts.push({"from_country": data[i].from_country, "count":data[i].count})
        }
        else { entry.count = Number(entry.count) + Number(data[i].count)};
    };

    // data.map(country => {
    //     for (var i=0; i < country_counts.length; i++) {
    //         if (country_counts[i].from_country === country.from_country) {
    //             country_counts[i].count += country.count;
    //         }
    //         else {
    //             country_counts.push({"from_country": country.from_country, "count":country.count})
    //         }
    //       // add from_country to country_counts if not exists already
    //       // add count to from_country's count
    //     }
    // });
    country_counts.sort(function (a, b) {
        return a.count - b.count;
    })

    // console.log("country_counts", country_counts)

    var myGroups = d3.map(country_counts, function(d){return d.from_country;}) //group
    var myVars = d3.map(country_counts, function(d){return d.from_country;}) //variable

    // console.log("myGroups", myGroups)
    // console.log("myVars", myVars)

    let hmWidth = 1300;
    let hmHeight = 1300;
    // Build X scales and axis:
    var x = d3.scaleBand()
      .range([ 100, 100+hmWidth ])
      .domain(myGroups)
      .padding(0.05);
    heatmap.append("g")
      .style("font-size", 10)
      .attr("id", "xlabels")
      .attr("transform", "translate(0," + (hmHeight) + ")")
      .call(d3.axisBottom(x))
      .select(".domain").remove();

    heatmap.select("#xlabels").selectAll("text")
        .style("font-family", "cinetype")
        .style("text-anchor", "end")
        .attr("transform", "rotate(-40) translate(-5, -5)");

    // Build Y scales and axis:
    var y = d3.scaleBand()
      .range([ hmHeight, 0 ])
      .domain(myVars)
      .padding(0.05);
    heatmap.append("g")
      .style("font-size", 10)
      .attr("id", "ylabels")
      .attr("transform", "translate( 100 , 0 )")
      .call(d3.axisLeft(y))
      .select(".domain").remove();

    // Build color scale
    var myColor = d3.scaleSequential()
      .interpolator(d3.interpolateViridis)
      .domain([1,100]);

    // create a tooltip
    var tooltip = d3.select("#my_dataviz")
      .append("div")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "2px")
      .style("border-radius", "5px")
      .style("padding", "5px")

    // add the squares
    heatmap.selectAll()
      .data(data, function(d) {return d.from_country+':'+d.to_country;})
      .enter()
      .append("rect")
        .attr("x", function(d) { return x(d.from_country) })
        .attr("y", function(d) { return y(d.to_country) })
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("width", x.bandwidth() )
        .attr("height", y.bandwidth() )
        .style("fill", function(d) { return myColor(d.count)} )
        .style("stroke-width", 4)
        .style("stroke", "none")
        .style("opacity", 0.8)
        .on('mouseenter', function(event, d) {
            // show tooltip on mouse enter, using capital marker
            tip.show(d.count, this);
            d3.select(this)
              .style("stroke", "black")
              .style("opacity", 1);
        })
        .on('mouseout', function(event, d) {
            // hide tooltip on mouse out
            tip.hide();
            d3.select(this)
              .style("stroke", "none")
              .style("opacity", 0.8);
        });
})





heatmap.selectAll('text')
                  .style("font-family", "cinetype")
                  .style("text-anchor", "start")
                  .attr("transform", `rotate(-40)`);

// Add title to graph
heatmap.append("text")
      .attr("x", 0)
      .attr("y", -50)
      .attr("text-anchor", "left")
      .style("font-size", "22px")
      .text("A d3.js heatmap");

// Add subtitle to graph
heatmap.append("text")
      .attr("x", 0)
      .attr("y", -20)
      .attr("text-anchor", "left")
      .style("font-size", "14px")
      .style("fill", "grey")
      .style("max-width", 400)
      .text("A short description of the take-away message of this chart.");

// SECTION: Styling the svg
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
