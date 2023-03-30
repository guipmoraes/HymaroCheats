var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "indra",
  password: "Cemd12312",
  database: "syantvincular"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("MYSQL Conectado!!");
  });

function getUserLicenses(callback){
    con.query("SELECT * FROM users", function (err, result, fields) {
        if (err) throw err;
        return callback(result);
      });
}
function getGames(callback){
  con.query("SELECT * FROM games ", function (err, result, fields) {
      if (err) throw err;
      return callback(result);
    });
}
function getUserLicenseByGameID(userId, gameId, callback){
  con.query("SELECT * FROM licenses WHERE userId = ? AND gameId = ?", [userId, gameId], function (err, result, fields) {
    if (err) throw err;
    return callback(result);
  });
}

module.exports = {getUserLicenses, getUserLicenseByGameID, getGames};