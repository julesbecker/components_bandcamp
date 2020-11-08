const express = require('express');
const app = express();
var path = require('path');

app.use('/static', express.static(__dirname + '/static'));

app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname + '/static/index.html'));
})

let server = app.listen(5000, function() {
  console.log("listening on 5000");
});

process.on('unhandledRejection', (reason, p) => {
  console.log("Unhandled promise rejection");
  console.log(reason.stack);
});

process.on('SIGINT', () => {
  console.log("closing server");
  server.close();
})