var path = require('path');
const { promises: fs } = require("fs");

async function generateHTML() {
  try {
    console.log(process.env.NODE_ENV);
    var root = (process.env.NODE_ENV == "dev") ? "//localhost:5000/" : "//view.components.one/";
    var jsLoc = "/../static/js/bundle.js";
    var cssLoc = root + "static/css/style.css";
    // var js = await fs.readFile(path.join(__dirname + '/../static/js/bundle.js'));
    // var css = await fs.readFile(path.join(__dirname + '/../static/css/style.css'));
    var txt = ` <html><body>
                <link rel="stylesheet" type="text/css" href="${cssLoc}"></style>
                <h1>built from template.html!</h1>
                <div id="map-container" class="svg-container">
                  <script src="${jsLoc}"></script>
                </div></body></html>`;
    await fs.writeFile(path.join(__dirname + '/../static/template.html'), txt);
  } catch (err) {
    console.log(err);
  }  
}

generateHTML();