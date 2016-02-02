/**
 * Created by austin on 1/27/16.
 *
 * Just getting started with d3.js
 * Code is very verbose oopsies.
 *
 * Datasets:
 * Presidential popularity: http://www.presidency.ucsb.edu/data/popularity.php
 */

"use strict";

var nukeData, presData;

var earthRadius = 5;
var presMaxRadius = 300;
var defaultYear = "1974";

const YEAR_KEY = "Year";
const MEGATON_KEY = "Megatonnage";
const PRESIDENT_KEY = "President";
const AVG_APPR_KEY = "Avg Approval";
const AVG_DISAPPR_KEY = "Avg Disapproval";
const AVG_UNSURE_KEY = "Avg Unsure";
const PRES_IMG_PATH = "images/publicOpinion/";


// Shorthand for document ready
$(function() {
    makeNukeGraph();
});


function makeNukeGraph() {
    // First load all the data
    d3.csv("data/declassifiedStockpile.csv", function(err, nD){
        if (err != null) {
            console.log(err);
            return;
        }
        nukeData = nD;
        // Now load up el president-ayyyes
        d3.csv("data/presidentApproval.csv", function(err, pD){
            if (err != null) {
                console.log(err);
                return;
            }
            presData = pD;

            // Now the  fun stuff
            // Setup the graph container
            var graphContainer = d3.select(".nukeGraphContainer");

            // Setup range input
            var range = graphContainer.append("input")
                .attr("type", "range")
                .attr("value", defaultYear)
                .attr("min", Math.min.apply(Math, nukeData.map(function(obj) {return obj[YEAR_KEY];} )))
                .attr("max", Math.max.apply(Math, nukeData.map(function(obj) {return obj[YEAR_KEY];} )));

            range.on("input", function() {
                // Adjust the circle's radius depending on the year data
                update(this.value);
            });


            var nukeGraph = graphContainer.append("svg")
                .attr("id", "nukeGraphSvg")
                .attr("class", "graphArea");

            nukeGraph.append("title")
                .text("nukes on nukes");

            // Create patterns for svg elements backgrounds
            nukeGraph.append("defs")
                .append('pattern')
                .attr('id', 'nukeBg')
                .attr('patternUnits', 'userSpaceOnUse')
                .attr('width', 6)
                .attr('height', 4)
                .append("image")
                .attr("xlink:href", "images/nukeBg.jpg")
                .attr("x", 0)
                .attr("y", 0)
                .attr('width', 10)
                .attr('height', 8);

            var graphBounds = nukeGraph.node().getBoundingClientRect();

            // Add two circles: one for size of world that can be blown and one for reference
            var nukeCircle = nukeGraph.append("circle")
                .attr("id", "nukeCircle")
                .attr("fill", "url(#nukeBg)")
                .attr("cx", graphBounds.width/2)
                .attr("cy", graphBounds.height/2)
                .attr("r", 30);

            var earthCirlce = nukeGraph.append("circle")
                .attr("id", "earthCircle")
                .attr("fill", "green")
                .attr("cx", 20 + earthRadius)
                .attr("cy", graphBounds.height - 20 - earthRadius)
                .attr("r", earthRadius);

            // Add stats box with hide/show button
            var statsBox = graphContainer.append("div")
                .attr("id", "statsBox");
            // Now add the stats
            statsBox.append("h2")
                .text("Stats");

            // Add a box for the year
            graphContainer.append("p")
                .attr("id", "yearBox");

            var presContainer = graphContainer.append("div")
                .attr("id", "presidents");

            presContainer.append("img")
                .attr("id", "good")
                .attr("class", "presOpinion");
            presContainer.append("img")
                .attr("id", "unsure")
                .attr("class", "presOpinion");
            presContainer.append("img")
                .attr("id", "bad")
                .attr("class", "presOpinion");

            update(defaultYear);
        });
    });
}

function update(year) {
    // Update the year text
    d3.select("#yearBox").text(year);

    // Search both data sources
    var yearNukeData = $.grep(nukeData, function(obj) {
        return obj[YEAR_KEY] === year;
    })[0];

    var yearPresData = $.grep(presData, function(obj) {
        return obj[YEAR_KEY] === year;
    })[0];

    // ~200 Megatons to wipe out human life
    // Updates the radius of the death circle
    var potentialNukeRadius = (earthRadius / 200) * yearNukeData[MEGATON_KEY];
    d3.select("#nukeCircle").transition().attr("r", potentialNukeRadius);

    var goodImg = d3.select("#good");
    var unsureImg = d3.select("#unsure");
    var badImg = d3.select("#bad");

    // Resize according to how great they're doin'
    var goodRad = presMaxRadius * yearPresData[AVG_APPR_KEY];
    var unsureRad = presMaxRadius * yearPresData[AVG_UNSURE_KEY];
    var badRad = presMaxRadius * yearPresData[AVG_DISAPPR_KEY];

    goodImg.transition()
        .attr("src", PRES_IMG_PATH + yearPresData[PRESIDENT_KEY] +  "/good.jpg")
        .attr("width", goodRad)
        .attr("height", goodRad);
    unsureImg.transition()
        .attr("src", PRES_IMG_PATH + yearPresData[PRESIDENT_KEY] + "/unsure.jpg")
        .attr("width", unsureRad)
        .attr("height", unsureRad);
    badImg.transition()
        .attr("src", PRES_IMG_PATH + yearPresData[PRESIDENT_KEY] + "/bad.jpg")
        .attr("width", badRad)
        .attr("height", badRad);

    // Now update the stats box
    var stats = {};
    stats["Megatons"] = parseFloat(yearNukeData[MEGATON_KEY]).toFixed(2);
    stats["Earths Killed"] = (yearNukeData[MEGATON_KEY] / 200).toFixed(2);
    stats["% Approve: "] = (yearPresData[AVG_APPR_KEY] * 100).toFixed(2);
    stats["% Unsure: "] = (yearPresData[AVG_UNSURE_KEY] * 100).toFixed(2);
    stats["% Disapprove: "] = (yearPresData[AVG_DISAPPR_KEY] * 100).toFixed(2);

    // Really roundabout way to do this, just trying to get accustomed to the d3 databinding
    var header = $("#statsBox h2").detach();
    // Empty all children then re-add the header. oops.
    $("#statsBox").empty().append(header);
    // Build a 'tuple' list for d3 data binding
    var statsList = [];
    for (var key in stats) {
        if (stats.hasOwnProperty(key)) {
            statsList.push([key, stats[key]]);
        }
    }
    // Initialize the stats to respond when they change
    // Broken down into the simplest steps. Really don't need to use
    // d3 for this
    var statsBox = d3.select("#statsBox");
    var boxes = statsBox.selectAll("p");
    var boxUpdate = boxes.data(statsList);
    var boxEnter = boxUpdate.enter().append("p");
    boxEnter.text(function(datum) { return datum[0] + ": " + datum[1]; });

   /* console.log("Year: " + year);
    console.log("Megatonnage: " + yearNukeData[MEGATON_KEY]);
    console.log("# Earths killed: " + potentialNukeRadius / earthRadius);*/
}

/** Resize the svg graph, aka the nuke circle. The little guy is so static sometimes. */
$(window).resize(function() {
    var graphBounds = d3.select("#nukeGraphSvg").node().getBoundingClientRect();
    d3.select("#nukeCircle")
        .attr("cx", graphBounds.width/2)
        .attr("cy", graphBounds.height/2);
});

/** Could eventually hold the tether-shepherd guided tour. If we want to get fancy. Nah. */
function walkthrough() {

}