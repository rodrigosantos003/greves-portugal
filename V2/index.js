const express = require("express");
const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/api/user/:id", (req, res) => {
  //TODO: Obter um utilizador pelo Id
});

app.post("/api/user", (req, res) => {
  //TODO: Inserir um user
});

app.put("/api/user/:id", (req, res) => {
  //TODO: Atualizar um user
});

app.delete("/api/user/:id", (req, res) => {
  //TODO: Eliminar um user
});

app.get("/api/greve", (req, res) => {
  //TODO: Ver todas as greves
});

app.get("/api/greve/:category", (req, res) => {
  //TODO: Obter todas as greves de uma categoria (ex: Comboios)
});

app.get("/api/greve/:id", (req, res) => {
  //TODO: Obter uma greve pelo id
});

app.post("/api/greve", (req, res) => {
  //TODO: Inserir uma greve
});

app.put("/api/greve/:id", (req, res) => {
  //TODO: Atualizar uma greve
});

app.delete("/api/greve/:id", (req, res) => {
  //TODO: Eliminar uma greve
});

app.listen(8081, () => {
  console.log("Server running at http://localhost:8081");
});
