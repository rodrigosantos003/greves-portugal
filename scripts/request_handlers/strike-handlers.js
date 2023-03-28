const mysql = require("mysql2");
const mysqlPool = require("../mysql-pool");

/**
 * Retrieves all strikes from the datababse
 * @param {*} request 
 * @param {*} response 
 */
function getStrikes(request, response) {
  mysqlPool.query(mysql.format("select * from strike"), (err, rows) => {
    if (err) response.json({ message: "Ocorreu um erro.", error: err.stack });
    else response.json({ greves: rows });
  });
}

function getStrikeById(request, response) {
  var id = request.params.id;

  if (id) {
    mysqlPool.query(
      mysql.format("select * from strike where id = ?", [id]),
      (err, rows) => {
        if (err)
          response.json({ message: "Ocorreu um erro.", error: err.stack });
        else if (rows.length) {
          response.json({
            message: "Greve obtida com sucesso.",
            greve: rows,
          });
        } else {
          response.json({message: "Não existe nenhuma greve com o id fornecido"})
        }
      }
    );
  } else {
    response.status(400).json({ message: "O id não foi especificado" });
  }
}

/**
 * Inserts a strike on the database
 * @param {*} request 
 * @param {*} response 
 */
function insertStrike(request, response) {
  var category = request.body.category;
  var startDate = request.body.startDate;
  var endDate = request.body.endDate;
  var description = request.body.description;

  if (category && startDate && endDate && description) {
    mysqlPool.query(
      mysql.format(
        "insert into strike (category, start_date, end_date, description) values(?, ?, ?, ?)",
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

/**
 * Updated a strike on the databse
 * @param {*} request 
 * @param {*} response 
 */
function updateStrike(request, response) {
  var id = request.params.id;
  var category = request.body.category;
  var startDate = request.body.startDate;
  var endDate = request.body.endDate;
  var description = request.body.description;

  if (id && category && startDate && endDate && description) {
    mysqlPool.query(
      mysql.format(
        "update strike set category=?, start_date=?, end_date=?, description=?",
        [category, startDate, endDate, description]
      ),
      (err, rows) => {
        if (err)
          response.json({ message: "Ocorreu um erro", error: err.stack });
        else {
          response.json({
            message: "Greve atualizada com sucesso.",
            greve: {
              id: id,
              category: category,
              startDate: startDate,
              endDate: endDate,
              description: description,
            },
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
 
/**
 * Deletes a strike on the database
 * @param {*} request 
 * @param {*} response 
 */
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
module.exports.getStrikeById = getStrikeById;
module.exports.insertStrike = insertStrike;
module.exports.updateStrike = updateStrike;
module.exports.deleteStrike = deleteStrike;
