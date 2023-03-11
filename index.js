const express = require("express");

const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.listen(8081, () => {
  console.log("Server running at http://localhost:8081");
});
