// GLOBALS
let express = require('express');
let path = require('path');
let bodyParser = require('body-parser');
let database = require('./database');


// MIDDLEWARE
let app = express();
app.use(express.static('dest'));
app.use(bodyParser.urlencoded({ extended: false }));


// ROUTES
app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname + '/dest/index.html'));
});

app.post('/post', function(req, res) {
	// database.runQuery(database.connection, 'SELECT * FROM Category', function(data) {
	// 	res.send(data);
	// });

	res.send(req.body);
	res.end();
});

app.listen(3000);