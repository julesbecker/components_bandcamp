const express = require('express');
const app = express();
var path = require('path');

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname + '/static/index.html'));
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