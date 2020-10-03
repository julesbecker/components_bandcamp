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

const data = LoadJson("locations-and-their-genres.json")

// const world10 = LoadJson("world10.json");
const world50 = LoadJson("world50.json");
const countries50 = LoadJson("countries50.json");
// const world110 = LoadJson("world110.json");

const countries = topojson.feature(countries50, countries50.objects.countries);

const cfos = LoadJson("country_flow_chart.json");
