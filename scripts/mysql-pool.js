"use strict";

const mysql = require("mysql2");
const options = require("./connection-options.json");

const pool = mysql.createPool(options);

module.exports = pool;
