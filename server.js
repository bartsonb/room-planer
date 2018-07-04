let express = require('express');
let path = require('path');

let app = express();

app.use(express.static('dest'));

app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname + '/dest/index.html'));
}).listen(3000);