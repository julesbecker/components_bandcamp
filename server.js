const express = require('express');
const app = express();
var path = require('path');

// Properly serve static files with correct MIME types
app.use('/static', express.static(path.join(__dirname, 'static'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
    // Remove nosniff header
    res.removeHeader('X-Content-Type-Options');
  }
}));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, 'static/index.html'));
});

app.get("/ext", function (req, res) {
  res.sendFile(path.join(__dirname + '/static/json/external.json'));
});

const port = process.env.PORT || 5000;
let server = app.listen(port, function () {
  console.log(`listening on ${port}`);
});

process.on('unhandledRejection', (reason, p) => {
  console.log("Unhandled promise rejection");
  console.log(reason.stack);
});

process.on('SIGINT', () => {
  console.log("closing server");
  server.close();
});