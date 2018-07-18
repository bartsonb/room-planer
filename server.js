// GLOBALS
let express = require('express');
let path = require('path');
let mysql = require('mysql');
let bodyParser = require('body-parser');


// MIDDLEWARE
let app = express();
app.use(express.static('dest'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// ROUTES
app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname + '/dest/index.html'));
});

//
app.post('/post', function(req, res) {
	const connection = mysql.createConnection({
		host     : 'localhost',
		user     : '',
		password : '',
		database : 'building-metadata'
	});

	req.body.floors.forEach( (floor, index) => {
		req.body.rooms.forEach( room => {
			if (room.floor === index) {
				let query = `INSERT INTO rooms (doors, windows, building, size, floor) VALUES (${room.doors}, ${room.windows}, '${req.body.buildingName}', ${room.qm}, '${floor.name}')`;
				connection.query(query, function (error, results, fields) {
					if (error) throw error;
					console.log(results);
				});
			}
		});
	});
});

app.listen(3000);