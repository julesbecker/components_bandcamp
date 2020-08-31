# Prototype

Goal is to create a version of Andrew's Tableau viz (https://public.tableau.com/profile/andrew.thompson#!/vizhome/bandcamptest/Sheet1?publish=yes) suitable for the Components site.

This means:
* world map
  * points on the cities where data is available
* tooltip
  * shows a graph of the genres for each city where available

to do:
* Title the map with an explanation of what it shows
* change zoom to non-scroll
* make zoom function smoother/less taxing. Switch to land-110 when moving?
* if x-axis text is too long, wraparound
* clean genres - remove cities, question the relevance of "electronic" and "electronica" as separate descriptors
* cross-browser compatibility(work with FF)

done:
* make the bars a function of the relative values, not the count values
* make the bars one color and more transparent
* add zoom function
* add a bubble toggle


## Sprint 1 (complete)
Start by making an Observable prototype.

- World Map, with dots representing the cities in the dataset
- Mousing over the dot prompts a tooltip
- Idea: instead of the Tableau tooltip, have a connected graph at the bottom
