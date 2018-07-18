// DOM
let DOM = {
	wrapper: document.querySelector('.svg-wrapper'),
	layerlist: document.querySelector('.layerList'),
	button: {
		room: document.querySelector('#room-tool'),
		polygon: document.querySelector('#polygon-tool'),
		door: document.querySelector('#door-tool'),
		window: document.querySelector('#window-tool'),
		layer: document.querySelector('.new-layer')
	},
	form: {
		this: document.querySelector('form'),
		floors: document.querySelector('.input-floors'),
		rooms: document.querySelector('.input-rooms'),
		submit: document.querySelector('.submit')
	}
};


// GLOBALS
let gridSize = 20;
let divider = 400;
let mode;
let tool;

let floors = [];
let rooms = [];

let pos = {
	x: undefined,
	y: undefined
};

let floor = {
	name: undefined,
	snap: undefined,
  pointerCircle: undefined,
  previewRoom: undefined,
	previewPolygon: undefined,
	previewPolygonHandle: undefined
};

let room = {
	doors: 0,
	windows: 0,
	floor: undefined,
	description: undefined,
	direction: undefined,
	polygon: [],
	p1: {
		x: undefined,
		y: undefined
	},
	p2: {
		x: undefined,
		y: undefined
	},
	width: function() {
		return Math.abs(this.p2.x - this.p1.x);
	},
	height: function() {
		return Math.abs(this.p2.y - this.p1.y);
	},
	size: function () {
		return (this.width() * this.height()) / divider;
	},
	polySize: function() {
		let a = 0;
		let y = this.polygon.filter(function(el, i) { return i % 2 === 1 });
		let x = this.polygon.filter(function(el, i) { return i % 2 === 0 });
		let n = Math.min(x.length, y.length);

		for (let i = 0; i < n; i++) {
			a += (y[i] + y[(i+1) % n]) * (x[i] - x[(i+1) % n]);
		}
		return Math.abs(a / 2) / divider;
	},
	isValid: function()  {
		return this.width() !== 0 && this.height() !== 0;
	},
	getDirection: function() {
		if (this.p1.x < this.p2.x && this.p1.y < this.p2.y) { return "top-left-bottom-right" }
		if (this.p1.x > this.p2.x && this.p1.y > this.p2.y) { return "bottom-right-top-left" }
		if (this.p1.x > this.p2.x && this.p1.y < this.p2.y) { return "top-right-bottom-left" }
		if (this.p1.x < this.p2.x && this.p1.y > this.p2.y) { return "bottom-left-top-right" }
	}
};


// EVENT HANDLER
DOM.form.submit.addEventListener('click', submitHandler);
DOM.button.layer.addEventListener('click', layerHandler);

Object.keys(DOM.button).forEach( key => {
	DOM.button[key].addEventListener('click', buttonHandler);
});


// FUNCTIONS

function removeText(){
    var textThatNeedsToBeRemoved = document.querySelector(".aufforderung");
	if(textThatNeedsToBeRemoved !== null){
    textThatNeedsToBeRemoved.remove();

	}
}

function layerHandler() {
	let floorCount = floors.length;
	let floorName = window.prompt('Names des Stockwerks?').replace(/\s/g, "-").toLowerCase();
    removeText();
	// creating a new SVG Element
	let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute('class', floorName);
	svg.setAttribute('id', floorCount);
	svg.style.zIndex = "100";

	DOM.wrapper.append(svg);

	floor.name = floorName;
	floor.snap = Snap('.' + floorName);

	// setting event listener
	floor.snap.node.addEventListener('mousemove', moveHandler);
	floor.snap.node.addEventListener('mousemove', livePreview);

	floor.snap.node.addEventListener('mousedown', mouseDownHandler);
	floor.snap.node.addEventListener('mouseup', mouseUpHandler);

	floor.snap.node.addEventListener('click', clickHandler);

	// set mode
	mode = "idle";

	// set tool
	Object.keys(DOM.button).forEach( key => {
		if ( DOM.button[key].checked ) { tool = key; }
	});

	// drawing grid
	let width = floor.snap.node.getBoundingClientRect().width;
	let height = floor.snap.node.getBoundingClientRect().height;
	let lines = floor.snap.g().attr({	class: 'lines' });

	for (let i = gridSize; i <= width; i += gridSize) {
		lines.add(floor.snap.line(i, 0, i, height).attr({	stroke: '#efefef' }));
	}

	for (let i = gridSize; i <= height; i+= gridSize) {
		lines.add(floor.snap.line(0, i, width, i).attr({ stroke: '#efefef' }));
	}

	// display floor name and add new layer button
	floor.snap.text(15, 25, floorName).attr({ class: 'layername' });
	addLayerButton(floorName);

	// create previewPolygon and previewPolygonHandle
	floor.previewPolygon = floor.snap.polygon(-50, -50).attr({ class: 'previewPolygon' });
	floor.previewPolygonHandle = floor.snap.circle(-50, -50, 4, 4).attr({ class: 'previewPolygonHandle' });

	// create previewRoom
	floor.previewRoom = floor.snap.rect(-50, -50, gridSize, gridSize).attr({ class: 'preview' });

	// create pointerCircle
	floor.pointerCircle = floor.snap.ellipse(-50, -50, 2.5, 2.5).attr({ class: 'pointer' });

	// pushing deep copy to floors array
	floors.push( $.extend(true, {}, floor) );

	// update layerlist
	updateLayerList();
}

function submitHandler(event) {
	event.preventDefault();
	let floorNames = [];
	Object.keys(floors).forEach( key => { floorNames.push(floors[key].name) });

	DOM.form.rooms.value = JSON.stringify(rooms);
	DOM.form.floors.value = floorNames;
	DOM.form.this.submit();
}

function buttonHandler(event) {
	// get tool name from radiobutton id 
	tool = event.target.id.split("-")[0];
}

function clickHandler() {
	if (tool === "door") {
		rooms.forEach(room => {	addDoor(pos, room, isSide(room, pos, room.direction)) });
	}

	if (tool === "window") {
		rooms.forEach(room => { addWindow(pos, room, isSide(room, pos, room.direction)) });
	}

	// POLYGON START DRAWING
	if (tool === "polygon") {

		// START POLYGON
		if (mode === "idle") {
			mode = "drawingPolygon";
			floors[room.floor].previewPolygonHandle.attr({ cx: pos.x, cy: pos.y });
			room.polygon.push(pos.x, pos.y);
		}

		// CONTINUE POLYGON
		else if (mode === "drawingPolygon" && (pos.x !== room.polygon[0] || pos.y !== room.polygon[1])) {
			room.polygon.push(pos.x, pos.y)
		}

		// END POLYGON
		else if (mode === "drawingPolygon" && (pos.x === room.polygon[0] && pos.y === room.polygon[1])) {
			mode = "idle";
			floors[room.floor].previewPolygonHandle.attr({ cx: -50, cy: -50 });
			room.polygon.push(pos.x, pos.y);
			addPolygon(room.polygon);
		}
	}

}

function moveHandler(event) {
	// substracting the coordinates of the svg element from the coordinates of the mouse click event.
	// position gets rounded up to a mutltiple of 20 to fit the grid size
	pos.x = Math.round((event.x - this.getBoundingClientRect().x) / gridSize) * gridSize;
	pos.y = Math.round((event.y - this.getBoundingClientRect().y) / gridSize) * gridSize;

	if (mode === "drawing") {
		room.p2.x = pos.x;
		room.p2.y = pos.y;
	}

	// setting floor in temporary room
	room.floor = parseInt(this.getAttribute('id'));

	// updating position of the pointercircle
	floors[room.floor].pointerCircle.attr({ cx: pos.x, cy: pos.y });
}

function livePreview() {
	if (mode === "drawing") {
		if ( room.isValid() ) {
			switch ( room.getDirection() ) {
				case "top-left-bottom-right":
					floors[room.floor].previewRoom.attr({ x: room.p1.x, y: room.p1.y, width: room.width(), height: room.height() });
					break;
				case "bottom-right-top-left":
					floors[room.floor].previewRoom.attr({ x: room.p2.x, y: room.p2.y, width: room.width(), height: room.height() });
					break;
				case "top-right-bottom-left":
					floors[room.floor].previewRoom.attr({ x: room.p2.x, y: room.p1.y, width: room.width(), height: room.height() });
					break;
				case "bottom-left-top-right":
					floors[room.floor].previewRoom.attr({ x: room.p1.x, y: room.p2.y, width: room.width(), height: room.height() });
					break;
			}
		} else {
			floors[room.floor].previewRoom.attr({x: -500, y: -500});
		}
	} else {
		floors[room.floor].previewRoom.attr({x: -500,	y: -500});
	}

	// UPDATE PREVIEW POLYGON
	if (mode === "drawingPolygon") {
		if (mode === "drawingPolygon") {
			floors[room.floor].previewPolygon.attr({ points: room.polygon + "," + pos.x + "," + pos.y });
		} else {
			floors[room.floor].previewPolygon.attr({ points: [-500, -500] });
		}
	} else {
		floors[room.floor].previewPolygon.attr({ points: [-500, -500] });
	}
}

function mouseDownHandler() {
	drawroom("start", pos);
}

function mouseUpHandler() {
	drawroom("stop", pos);
}

function drawroom(action, pos) {
	if (tool === "room") {
		if (action === "start") {
			mode = "drawing";
			room.p1.x = pos.x;
			room.p1.y = pos.y;
		}

		if (action === "stop") {
			mode = "idle";
			room.p2.x = pos.x;
			room.p2.y = pos.y;

			if ( room.isValid() ) { addRoom( room.getDirection() ) }
		}
	}
}

function isSide(room, pos, direction) {
	switch (direction) {
		case "top-left-bottom-right":
			if (pos.x > room.p1.x && pos.x < room.p2.x && ( pos.y === room.p1.y || pos.y === room.p2.y ) ) { return "vertical" }
			if (pos.y > room.p1.y && pos.y < room.p2.y && ( pos.x === room.p1.x || pos.x === room.p2.x ) ) { return "horizontal"; }
			break;

		case "bottom-right-top-left":
			if (pos.x < room.p1.x && pos.x > room.p2.x && ( pos.y === room.p1.y || pos.y === room.p2.y ) ) { return "vertical" }
			if (pos.y < room.p1.y && pos.y > room.p2.y && ( pos.x === room.p1.x || pos.x === room.p2.x ) ) { return "horizontal"; }
			break;

		case "top-right-bottom-left":
			if (pos.x < room.p1.x && pos.x > room.p2.x && ( pos.y === room.p1.y || pos.y === room.p2.y ) ) { return "vertical" }
			if (pos.y > room.p1.y && pos.y < room.p2.y && ( pos.x === room.p1.x || pos.x === room.p2.x ) ) { return "horizontal"; }
			break;

		case "bottom-left-top-right":
			if (pos.x > room.p1.x && pos.x < room.p2.x && ( pos.y === room.p1.y || pos.y === room.p2.y ) ) { return "vertical" }
			if (pos.y < room.p1.y && pos.y > room.p2.y && ( pos.x === room.p1.x || pos.x === room.p2.x ) ) { return "horizontal"; }
			break;
	}

	return false;
}

function addDoor(pos, room, rotation) {
	if (rotation === "vertical") { room.doors += 1; floors[room.floor].snap.rect(pos.x - 5, pos.y - 3, 10, 6).addClass('door'); }
	if (rotation === "horizontal") { room.doors += 1; floors[room.floor].snap.rect(pos.x - 5, pos.y - 3, 10, 6).addClass('door').transform('r90'); }
}

function addWindow(pos, room, rotation) {
	if (rotation === "vertical") { room.windows += 1; floors[room.floor].snap.rect(pos.x - 5, pos.y - 3, 10, 6).addClass('window'); }
	if (rotation === "horizontal") { room.windows += 1; floors[room.floor].snap.rect(pos.x - 5, pos.y - 3, 10, 6).addClass('window').transform('r90'); }
}

function addRoom(direction) {
	room.description = window.prompt("Zweck des Zimmers?");
	room.direction = room.getDirection();
	let roomElement, descElement, sizeElement;

	switch (direction) {
		case "top-left-bottom-right":
			roomElement = floors[room.floor].snap.rect(room.p1.x, room.p1.y, room.p2.x - room.p1.x, room.p2.y - room.p1.y).attr({class: 'room'});
			descElement = floors[room.floor].snap.text(room.p1.x + 5, room.p1.y + 15, room.description).attr({class: 'desc'});
			sizeElement = floors[room.floor].snap.text(room.p1.x + 5, room.p1.y + 28, room.size() + "qm").attr({class: 'size'});
			break;

		case "bottom-right-top-left":
			roomElement = floors[room.floor].snap.rect(room.p2.x, room.p2.y, room.p1.x - room.p2.x, room.p1.y - room.p2.y).addClass('room');
			descElement = floors[room.floor].snap.text(room.p2.x + 5, room.p2.y + 15, room.description).attr({class: 'desc'});
			sizeElement = floors[room.floor].snap.text(room.p2.x + 5, room.p2.y + 28, room.size() + "qm").attr({class: 'size'});
			break;

		case "top-right-bottom-left":
			roomElement = floors[room.floor].snap.rect(room.p2.x, room.p1.y, room.p1.x - room.p2.x, room.p2.y - room.p1.y).addClass('room'); 			descElement = floors[room.floor].snap.text(room.p2.x + 5, room.p1.y + 15, room.description).attr({class: 'desc'});
			sizeElement = floors[room.floor].snap.text(room.p2.x + 5, room.p1.y + 28, room.size() + "qm").attr({class: 'size'});
			break;

		case "bottom-left-top-right":
			roomElement = floors[room.floor].snap.rect(room.p1.x, room.p2.y, room.p2.x - room.p1.x, room.p1.y - room.p2.y).addClass('room');
			descElement = floors[room.floor].snap.text(room.p1.x + 5, room.p2.y + 15, room.description).attr({class: 'desc'});
			sizeElement = floors[room.floor].snap.text(room.p1.x + 5, room.p2.y + 28, room.size() + "qm").attr({class: 'size'});
			break;
	}


	floors[room.floor].snap.g(roomElement, descElement, sizeElement).attr({id: rooms.length});

	// pusing deep copy of room into rooms array
	rooms.push( $.extend(true, {}, room) );

	// update layerlist
	updateLayerList();
}

function addPolygon(coordinates) {
	room.description = window.prompt("Zweck des Zimmers?");
	let roomElement, descElement, sizeElement;

	roomElement = floors[room.floor].snap.polyline(coordinates).attr({ class: 'room' });
	descElement = floors[room.floor].snap.text(room.polygon[0] + 5, room.polygon[1] + 15, room.description).attr({class: 'desc'});
	sizeElement = floors[room.floor].snap.text(room.polygon[0] + 5, room.polygon[1] + 28, room.polySize() + "qm").attr({class: 'size'});

	floors[room.floor].snap.g(roomElement, descElement, sizeElement).attr({id: rooms.length});

	// pusing deep copy of room into rooms array
	rooms.push( $.extend(true, {}, room) );

	room.polygon = [];

	// update layerlist
	updateLayerList();
}

function addLayerButton(floorname) {
	const layerBox = document.querySelector('.layerbuttons');
	console.log(layerBox);
    let btn = document.createElement('button');
	btn.innerText = floorname;
	btn.setAttribute('class', 'switch-layer');
	document.querySelector('.buttons').append(btn);
	btn.addEventListener('click', switchLayers);
    let newel = layerBox.appendChild(btn);
}

function switchLayers() {
	let svgs = document.querySelectorAll('svg');
	let btnText = event.target.innerText;

	svgs.forEach( svg => svg.style.zIndex = "0" );
	svgs.forEach( svg => {
		if ( svg.getAttribute('class') === btnText ) { svg.style.zIndex = "100"; }
	});
}


function updateLayerList() {
	// CLEAR LIST
	DOM.layerlist.innerHTML = "";

	floors.forEach( (floor, index) => {
		let newListTitle = document.createElement('li');
		newListTitle.setAttribute('class', 'layerListTitle');
		newListTitle.innerHTML = "<b>" + floor.name + "</b>";
		DOM.layerlist.append(newListTitle);

		rooms.forEach( room => {
			if ( room.floor === index ) {
				let newListEntry = document.createElement('li');
				newListEntry.setAttribute('class', 'layerListEntry');
				newListEntry.innerText = room.description;
				DOM.layerlist.append(newListEntry);
			}
		});
	});
}