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

	console.log(req.body.rooms);
	console.log(req.body.floors);

	// res.send(JSON.stringify(req.body, null, 2));
	res.end();
});

app.listen(3000);