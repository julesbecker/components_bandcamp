# Prototype

Goal is to create a version of Andrew's Tableau viz (https://public.tableau.com/profile/andrew.thompson#!/vizhome/bandcamptest/Sheet1?publish=yes) suitable for the Components site.

Code overview:
- Assets and Data:
  - **world10.json** provides the data that renders the geomap. **world50.json** and **world110.json** are the same, but with slightly less resolution.
  - **test.svg** is an svg cut-out matching the size and position of the butterfly map outline.
  - **locations-and-their-genres.json** contains the raw data that the program uses to populate the map with city circles and generate the bar charts.
- Calculation and rendering:
  - **index.html** displays the visualization. The rendering all happens here.
  - **d3_tip.js** contains the code that enables the tooltip to work. It is a local copy of https://github.com/caged/d3-tip.
  - **data_prep.js** prepares locations-and-their-genres.json by generating some additional variables and adding them to the json, then passes it to index.html.
  - **style.css** is your friendly neighborhood stylesheet. It's of limited use with svg, but you can still use it to set fonts and it controls the majority of the tooltip styling.


## Sprint 1 (complete)
Start by making an Observable prototype.

- World Map, with dots representing the cities in the dataset
- Mousing over the dot prompts a tooltip
- Idea: instead of the Tableau tooltip, have a connected graph at the bottom

## Sprint 2
Figma sketch for the next iteration is here: https://www.figma.com/file/WGnNUFggXV0YVKmW5JC25a/Untitled?node-id=0%3A1

The plan involves:
- separating the graph and map into two side-by-side svgs
- changing the types of charts that are presented when "Relative" or "Absolute" are toggled - "Relative" containing the relative value comparisons, "Absolute" the total counts

In order to achieve this without sacrificing performance, performance needs to improve significantly. Some possibilities:
- preprocess the data as much as possible to minimize runtime calculations
- Switch to world110 when panning or zooming (e.g., https://observablehq.com/@d3/versor-zooming)
- stop using D3's native transition library and switch it to PixiJS, at least for circle rendering (http://pixijs.download/release/docs/index.html)
