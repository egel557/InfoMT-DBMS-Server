"use strict"

const mysql  = require('mysql');
const db = mysql.createConnection({
  host : '192.168.64.3',
  user : 'me',
  password : '',
  database : 'billing_db',
  multipleStatements: true
});

module.exports = db