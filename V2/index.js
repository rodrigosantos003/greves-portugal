const express = require("express");
const userHandlers = require("./scripts/request_handlers/user-handlers.js");
const strikeHandlers = require("./scripts/request_handlers/strike-handlers.js");

const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/*USERS*/

app.get("/api/user/:id", (req, res) => {
  //TODO: Obter um utilizador pelo Id
});

app.post("/api/user", userHandlers.signup);

app.put("/api/user/:id", (req, res) => {
  //TODO: Atualizar um user
});

app.delete("/api/user/:id", (req, res) => {
  //TODO: Eliminar um user
});

app.post("/api/login", userHandlers.login);

/*STRIKES*/

app.get("/api/strike", strikeHandlers.getStrikes);

app.get("/api/strike/:category", strikeHandlers.getStrikesByCategory);

app.get("/api/strike/:id", strikeHandlers.getStrikeById);

app.post("/api/strike", strikeHandlers.insertStrike);

app.put("/api/strike/:id", strikeHandlers.updateStrike);

app.delete("/api/strike/:id", strikeHandlers.deleteStrike);

app.listen(8081, () => {
  console.log("Server running at http://localhost:8081");
});
