"use strict"

const mysql      = require('mysql');
const db = mysql.createConnection({
    // port: 8080,
  host     : '192.168.64.3',
  user     : 'me',
  password : '',
  database : 'billing_db',
  multipleStatements: true
});

module.exports = db
 
// connection.connect();
 
// connection.query('SELECT * FROM My_Table', function (error, results, fields) {
//   if (error) throw error;
//   console.log(results)
// //   console.log('The solution is: ', results[0].solution);
// });
 
// connection.end();