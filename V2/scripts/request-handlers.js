const mysql = require("mysql2");
const mysqlPool = require("./mysql-pool");
const bcrypt = require("bcrypt");

function signup(request, response, next) {
  var name = request.body.name;
  var email = request.body.email;
  var password = request.body.password;

  if (name && email && password) {
    mysqlPool.query(
      mysql.format("select * from user where email = ?", [email]),
      (error, rows) => {
        if (error) {
          next(error);
        } else if (rows.length) {
          response
            .status(409)
            .json({ message: "O utilizador já foi registado." });
        } else {
          bcrypt.hash(password, 10, (error, hash) => {
            if (error) {
              next(error);
            } else {
              mysqlPool.query(
                mysql.format(
                  "insert into user (name, email, password) values (?, ?, ?)",
                  [name, email, hash]
                ),
                (error, rows) => {
                  if (error) {
                    next(error);
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

function login(request, username, password, done) {
  mysqlPool.query(
    mysql.format("select * from user where username = ?", [username]),
    (err, rows) => {
      if (err) {
        done(err);
      } else if (!rows.length) {
        done(null, false, { message: "Utilizador não encontrado." });
      } else {
        bcrypt.compare(password, rows[0].password, (err, result) => {
          if (err) {
            done(err);
          } else if (result) {
            delete rows[0].password;
            done(null, rows[0]);
          } else {
            done(null, false, { message: "Password incorreta." });
          }
        });
      }
    }
  );
}

(module.exports.signup = signup), (module.exports.login = login);
