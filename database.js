const mysql = require('mysql');

const connection = mysql.createConnection({
	host     : 'localhost',
	user     : '',
	password : '',
	database : ''
});

let runQuery = function(conn, queryString, callback) {
	conn.query(queryString, function (error, results, fields) {
		if (error) throw error;
		callback(results);
	});
};

module.exports = { connection, runQuery };