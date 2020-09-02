

function LoadJson(url) {
    var json = null;
    $.ajax({
      'async': false,
      'global': false,
      'url': url,
      'dataType': "json",
      'success': function(data) {
        json = data;
      }
    });
    return json;
  };

const data = LoadJson("locations-and-their-genres.json").map((d) => {
    d.total_no = 0;
    d.coords = [d.long, d.lat];
    for (var i = 0; i < d.artist_cats.length; i++) {
      // "relative" is what will be on the bar chart, so sorting artists accordingly.
      d.artist_cats.sort((a, b) => (a.relative < b.relative) ? 1 : -1)
      // total_no determines circle size
      d.total_no = d.total_no + d.artist_cats[i].count;
    }
    d.mostpopular = d.artist_cats[0].genre;
  return d})

const theworld = LoadJson("world50.json");


function findChartmax(data) {
  var max_value = 0
  var num_array = []
    for (var i = 0; i < data.length; i++) {
      num_array.push(data[i].artist_cats[0].relative);
     //if (data.d.artist_cats[0].count > max_value) {max_value = i.artist_cats[0].count}
    }
  return Math.max(...num_array);
}

const chartmax = findChartmax(data);
