const express = require("express");
const userHandlers = require("./scripts/request_handlers/user-handlers.js");
const strikeHandlers = require("./scripts/request_handlers/strike-handlers.js");
var mustacheExpress = require("mustache-express");
const http = require("http")

const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.engine("mustache", mustacheExpress());
app.set("view engine", "mustache");
app.set("views", __dirname + "/public");

/* PAGES */
app.get("/", (request, response) => {
  http.get("http://localhost:8081/api/strike", (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk
    })

    res.on("end", () => {
      var dataFormatted = JSON.parse(data).greves.map((greve) => {
        start_dateFormatted = new Date(greve.start_date).toLocaleDateString().split("/")
        end_dateFormatted = new Date(greve.end_date).toLocaleDateString().split("/")
        return ({...greve, 
          start_date: `${start_dateFormatted[0]}/${start_dateFormatted[1]}/${start_dateFormatted[2]}`,
          end_date: `${end_dateFormatted[0]}/${end_dateFormatted[1]}/${end_dateFormatted[2]}`}
          )})
      
      response.render("index", { greves: dataFormatted });
    })
  })
});

app.get("/login", (request, response) => {
  response.render("login")
})

app.get("/registo", (request, response)=>{
  response.render("register")
})

/*USERS*/
app.post("/api/user", userHandlers.signup);

app.post("/api/login", userHandlers.login);

/*STRIKES*/
app.get("/api/strike", strikeHandlers.getStrikes);

app.get("/api/strike/:id", strikeHandlers.getStrikeById);

app.post("/api/strike", strikeHandlers.insertStrike);

app.put("/api/strike/:id", strikeHandlers.updateStrike);

app.delete("/api/strike/:id", strikeHandlers.deleteStrike);

app.listen(8081, () => {
  console.log("Server running at http://localhost:8081");
});
