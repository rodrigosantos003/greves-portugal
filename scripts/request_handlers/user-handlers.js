const mysql = require("mysql2");
const mysqlPool = require("../mysql-pool");
const bcrypt = require("bcrypt");
const e = require("express");

/**
 * Signs up a user
 * @param {*} request
 * @param {*} response
 */
function signup(request, response) {
  var name = request.body.name;
  var email = request.body.email;
  var password = request.body.password;

  if (name && email && password) {
    mysqlPool.query(
      mysql.format("select * from user where email = ?", [email]),
      (err, rows) => {
        if (err) {
          response.json({ message: "Ocorreu um erro", error: err.stack });
        } else if (rows.length) {
          response
            .status(409)
            .json({ message: "O utilizador já foi registado." });
        } else {
          bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
              response.json({ message: "Ocorreu um erro", error: err.stack });
            } else {
              mysqlPool.query(
                mysql.format(
                  "insert into user (name, email, password) values (?, ?, ?)",
                  [name, email, hash]
                ),
                (err, rows) => {
                  if (err) {
                    response.json({
                      message: "Ocorreu um erro",
                      error: err.stack,
                    });
                  } else {
                    response.json({
                      message: "Conta criada com sucesso.",
                      user: {
                        id: rows.id,
                        name: name,
                        email: email,
                      },
                    });
                  }
                }
              );
            }
          });
        }
      }
    );
  } else {
    response.status(400).json({
      message: "O nome de utilizador, email ou password está em falta.",
    });
  }
}

/**
 * Logs a user in
 * @param {*} request
 * @param {*} response
 */
function login(request, response) {
  var email = request.body.email;
  var password = request.body.password;

  if (email && password) {
    mysqlPool.query(
      mysql.format("select * from user where email = ?", [email]),
      (err, rows) => {
        if (err)
          response.json({ message: "Ocorreu um erro", error: err.stack });
        else if (!rows.length)
          response.status(401).json({ message: "Utilizador não encontrado." });
        else {
          bcrypt.compare(password, rows[0].password, (err, result) => {
            if (err) {
              response.json({ message: "Ocorreu um erro", error: err.stack });
            } else if (result) {
              delete rows[0].password;
              response.json({
                message: "Login efetuado com sucesso",
                user: rows,
              });
            } else {
              response.status(401).json({ message: "Password incorreta." });
            }
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

module.exports.signup = signup;
module.exports.login = login;
