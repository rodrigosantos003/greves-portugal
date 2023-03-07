const express = require("express");

const app = express();

app.use(express.static("www"));

app.listen(8081, () => {
  console.log("Server running at http://localhost:8081");
});
