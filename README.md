## How to Run:
Run `npm start` in the command line

## Configuring Database Connection:
Edit these lines in the file `config/db.js`
```javascript
const db = mysql.createConnection({
  host : '192.168.64.3',
  user : 'me', 
  password : '',
  database : 'billing_db',
  multipleStatements: true, // do not change
});
```
