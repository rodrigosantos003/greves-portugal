const express = require("express");

const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/api/user/:id", (req, res) => {
  //TODO: Get user by id
});

app.post("/api/user", (req, res) => {
  //TODO: Insert an user
});

app.put("/api/user/:id", (req, res) => {
  //TODO: Update the user
});

app.get("/api/user/:id/record", (req, res) => {
  //TODO: Get weather records requested by the user
});

app.post("/api/user/:id/record", (req, res) => {
  //TODO: Insert the weather record requested by the user
});

app.delete("/api/user/:id/record/:id", (req, res) => {
  //TODO: Delete a weather record
});

app.listen(8081, () => {
  console.log("Server running at http://localhost:8081");
});
