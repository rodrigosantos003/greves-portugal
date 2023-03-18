const mysql = require("mysql2");
const mysqlPool = require("../mysql-pool");

function getStrikes(request, response) {
  mysqlPool.query(mysql.format("select * from strike"), (err, rows) => {
    if (err) response.json({ message: "Ocorreu um erro.", error: err.stack });
    else response.json({ greves: rows });
  });
}

function getStrikesByCategory(request, response) {
  var category = request.params.category;

  if (category) {
    mysqlPool.query(
      mysql.format("select * from strike where category = ?", [category]),
      (err, rows) => {
        if (err)
          response.json({ message: "Ocorreu um erro.", error: err.stack });
        else if (rows.length)
          response.json({
            message: "Greves obtidas com sucesso.",
            greves: rows,
          });
      }
    );
  } else {
    response.status(400).json({ message: "A categoria não foi especificada" });
  }
}

function getStrikeById(request, response) {
  var id = request.params.id;

  if (id) {
    mysqlPool.query(
      mysql.format("select * from strike where id = ?", [id]),
      (err, rows) => {
        if (err)
          response.json({ message: "Ocorreu um erro.", error: err.stack });
        else if (rows.length)
          response.json({
            message: "Greve obtida com sucesso.",
            greve: rows,
          });
      }
    );
  } else {
    response.status(400).json({ message: "O id não foi especificado" });
  }
}

function insertStrike(request, response) {
  var category = request.body.category;
  var startDate = request.body.startDate;
  var endDate = request.body.endDate;
  var description = request.body.description;

  if (category && startDate && endDate && description) {
    mysqlPool.query(
      mysql.format(
        "insert into strike (category, startDate, entDate, description), values(?, ?, ?, ?)",
        [category, startDate, endDate, description]
      ),
      (err, rows) => {
        if (err)
          response.json({ message: "Ocorreu um erro.", error: err.stack });
        else
          response.json({
            message: "Greve inserida com sucesso.",
            greve: {
              id: rows.id,
              category: category,
              startDate: startDate,
              endDate: endDate,
              description: description,
            },
          });
      }
    );
  } else {
    response
      .status(400)
      .json({ message: "Os campos não estão todos preenchidos." });
  }
}

function updateStrike(request, response) {
  var id = request.params.id;
  var category = request.body.category;
  var startDate = request.body.startDate;
  var endDate = request.body.endDate;
  var description = request.body.description;

  if (id && category && startDate && endDate && description) {
    mysqlPool.query(
      mysql.format(
        "update strike set category=?, startDate=?, endDate=?, description=?",
        [category, startDate, endDate, description]
      ),
      (err, rows) => {
        if (err)
          response.json({ message: "Ocorreu um erro", error: err.stack });
        else {
          response.json({
            message: "Greve atualizada com sucesso.",
            greve: rows,
          });
        }
      }
    );
  } else {
    response
      .status(400)
      .json({ message: "Os campos não estão todos preenchidos." });
  }
}

function deleteStrike(request, response) {
  var id = request.params.id;

  if (id) {
    mysqlPool.query(
      mysql.format("delete from strike where id = ?", [id]),
      (err, rows) => {
        if (err)
          response.json({ message: "Ocorreu um erro.", error: err.stack });
        else response.json({ message: "Greve eliminada com sucesso." });
      }
    );
  } else {
    response.status(400).json({ message: "O id não foi especificado." });
  }
}

module.exports.getStrikes = getStrikes;
module.exports.getStrikesByCategory = getStrikesByCategory;
module.exports.getStrikeById = getStrikeById;
module.exports.insertStrike = insertStrike;
module.exports.updateStrike = updateStrike;
module.exports.deleteStrike = deleteStrike;
