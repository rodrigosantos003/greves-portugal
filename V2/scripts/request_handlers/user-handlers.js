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
          response.json({ message: "Utilizador não encontrado." });
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
              response.json({ message: "Password incorreta." });
              done(null, false, { message: "Password incorreta." });
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

/**
 * Retrieves a user given its id
 * @param {*} request
 * @param {*} response
 */
function getUserById(request, response) {
  var id = request.params.id;

  if (id) {
    mysqlPool.query(
      mysql.format("select * from user where id = ?", [id]),
      (err, rows) => {
        if (err)
          response.json({ message: "Ocorreu um erro.", error: err.stack });
        else
          response.json({
            message: "Utilizador obtido com sucesso.",
            user: rows,
          });
      }
    );
  } else {
    response.status(400).json({ message: "O id não foi especificado." });
  }
}

/**
 * Updates a user
 * @param {*} request
 * @param {*} response
 */
function updateUser(request, response) {
  var name = request.body.name;
  var email = request.body.email;
  var password = request.body.password;

  bcrypt.hash(password, 10, (error, hash) => {
    if (error) {
      response.json({ message: "Ocorreu um erro.", error: error.stack });
    } else {
      mysqlPool.query(
        mysql.format("update user set name = ?, email = ?, password = ?", [
          name,
          email,
          hash,
        ]),
        (error, rows) => {
          if (error) {
            response.json({
              message: "Ocorreu um erro.",
              error: error.stack,
            });
          } else {
            response.json({
              message: "Utilizador atualizado com sucesso",
              user: {
                name: name,
                email: email,
                password: hash,
              },
            });
          }
        }
      );
    }
  });
}

/**
 * Delets a user
 * @param {*} request
 * @param {*} response
 */
function deleteUser(request, response) {
  var id = request.params.id;

  if (id) {
    mysqlPool.query(
      mysql.format("delete from user where id = ?", [id]),
      (err, rows) => {
        if (err)
          response.json({ message: "Ocorreu um erro.", error: err.stack });
        else response.json({ message: "Utilziador eliminado com sucesso." });
      }
    );
  } else {
    response.status(400).json({ message: "O id não foi especificado." });
  }
}

module.exports.signup = signup;
module.exports.login = login;
module.exports.getUserById = getUserById;
module.exports.updateUser = updateUser;
module.exports.deleteUser = deleteUser;
