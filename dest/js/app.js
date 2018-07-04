// DOM
let DOM = {
	wrapper: document.querySelector('.svg-wrapper'),
	button: {
		room: document.querySelector('#room-tool'),
		door: document.querySelector('#door-tool'),
		window: document.querySelector('#window-tool'),
		delete: document.querySelector('#delete-tool'),
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
  previewRectangle: undefined
};

let rectangle = {
	doors: 0,
	windows: 0,
	floor: undefined,
	description: undefined,
	direction: undefined,
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
		return this.width() * this.height() / 400;
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
function layerHandler() {
	let floorCount = floors.length;
	let floorName = window.prompt('Names des Stockwerks?').replace(/\s/g, "-").toLowerCase();

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

	// create previewRectangle
	floor.previewRectangle = floor.snap.rect(-50, -50, gridSize, gridSize).attr({ class: 'preview' });

	// create pointerCircle
	floor.pointerCircle = floor.snap.ellipse(-50, -50, 2.5, 2.5).attr({ class: 'pointer' });

	// pushing deep copy to floors array
	floors.push( $.extend(true, {}, floor) );
}

function submitHandler(event) {
	event.preventDefault();
	DOM.form.rooms.value = JSON.stringify(rooms);
	DOM.form.floors.value = JSON.stringify(floors);
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
}

function moveHandler(event) {
	// substracting the coordinates of the svg element from the coordinates of the mouse click event.
	// position gets rounded up to a mutltiple of 20 to fit the grid size
	pos.x = Math.round((event.x - this.getBoundingClientRect().x) / gridSize) * gridSize;
	pos.y = Math.round((event.y - this.getBoundingClientRect().y) / gridSize) * gridSize;

	if (mode === "drawing") {
		rectangle.p2.x = pos.x;
		rectangle.p2.y = pos.y;
	}

	// setting floor in temporary rectangle
	rectangle.floor = parseInt(this.getAttribute('id'));

	// updating position of the pointercircle
	floors[rectangle.floor].pointerCircle.attr({ cx: pos.x, cy: pos.y });
}

function livePreview() {
	if (mode === "drawing") {
		if ( rectangle.isValid() ) {
			switch ( rectangle.getDirection() ) {
				case "top-left-bottom-right":
					floors[rectangle.floor].previewRectangle.attr({ x: rectangle.p1.x, y: rectangle.p1.y, width: rectangle.width(), height: rectangle.height() });
					break;
				case "bottom-right-top-left":
					floors[rectangle.floor].previewRectangle.attr({ x: rectangle.p2.x, y: rectangle.p2.y, width: rectangle.width(), height: rectangle.height() });
					break;
				case "top-right-bottom-left":
					floors[rectangle.floor].previewRectangle.attr({ x: rectangle.p2.x, y: rectangle.p1.y, width: rectangle.width(), height: rectangle.height() });
					break;
				case "bottom-left-top-right":
					floors[rectangle.floor].previewRectangle.attr({ x: rectangle.p1.x, y: rectangle.p2.y, width: rectangle.width(), height: rectangle.height() });
					break;
			}
		} else {
			floors[rectangle.floor].previewRectangle.attr({x: -500, y: -500});
		}
	} else {
		floors[rectangle.floor].previewRectangle.attr({x: -500,	y: -500});
	}
}

function mouseDownHandler() {
	drawRectangle("start", pos);
}

function mouseUpHandler() {
	drawRectangle("stop", pos);
}

function drawRectangle(action, pos) {
	if (tool === "room") {
		if (action === "start") {
			mode = "drawing";
			rectangle.p1.x = pos.x;
			rectangle.p1.y = pos.y;
		}

		if (action === "stop") {
			mode = "idle";
			rectangle.p2.x = pos.x;
			rectangle.p2.y = pos.y;

			if ( rectangle.isValid() ) { addRoom( rectangle.getDirection() ) }
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
	if (rotation === "vertical") { room.doors += 1; floors[rectangle.floor].snap.rect(pos.x - 5, pos.y - 3, 10, 6).addClass('door'); }
	if (rotation === "horizontal") { room.doors += 1; floors[rectangle.floor].snap.rect(pos.x - 5, pos.y - 3, 10, 6).addClass('door').transform('r90'); }
}

function addWindow(pos, room, rotation) {
	if (rotation === "vertical") { room.windows += 1; floors[rectangle.floor].snap.rect(pos.x - 5, pos.y - 3, 10, 6).addClass('window'); }
	if (rotation === "horizontal") { room.windows += 1; floors[rectangle.floor].snap.rect(pos.x - 5, pos.y - 3, 10, 6).addClass('window').transform('r90'); }
}

function addRoom(direction) {
	rectangle.description = window.prompt("Zweck des Zimmers?");
	rectangle.direction = rectangle.getDirection();
	let roomElement, descElement, sizeElement;

	switch (direction) {
		case "top-left-bottom-right":
			roomElement = floors[rectangle.floor].snap.rect(rectangle.p1.x, rectangle.p1.y, rectangle.p2.x - rectangle.p1.x, rectangle.p2.y - rectangle.p1.y).attr({class: 'room'});
			descElement = floors[rectangle.floor].snap.text(rectangle.p1.x + 5, rectangle.p1.y + 15, rectangle.description).attr({class: 'desc'});
			sizeElement = floors[rectangle.floor].snap.text(rectangle.p1.x + 5, rectangle.p1.y + 28, rectangle.size() + "qm").attr({class: 'size'});
			break;

		case "bottom-right-top-left":
			roomElement = floors[rectangle.floor].snap.rect(rectangle.p2.x, rectangle.p2.y, rectangle.p1.x - rectangle.p2.x, rectangle.p1.y - rectangle.p2.y).addClass('room');
			descElement = floors[rectangle.floor].snap.text(rectangle.p2.x + 5, rectangle.p2.y + 15, rectangle.description).attr({class: 'desc'});
			sizeElement = floors[rectangle.floor].snap.text(rectangle.p2.x + 5, rectangle.p2.y + 28, rectangle.size() + "qm").attr({class: 'size'});
			break;

		case "top-right-bottom-left":
			roomElement = floors[rectangle.floor].snap.rect(rectangle.p2.x, rectangle.p1.y, rectangle.p1.x - rectangle.p2.x, rectangle.p2.y - rectangle.p1.y).addClass('room'); 			descElement = floors[rectangle.floor].snap.text(rectangle.p2.x + 5, rectangle.p1.y + 15, rectangle.description).attr({class: 'desc'});
			sizeElement = floors[rectangle.floor].snap.text(rectangle.p2.x + 5, rectangle.p1.y + 28, rectangle.size() + "qm").attr({class: 'size'});
			break;

		case "bottom-left-top-right":
			roomElement = floors[rectangle.floor].snap.rect(rectangle.p1.x, rectangle.p2.y, rectangle.p2.x - rectangle.p1.x, rectangle.p1.y - rectangle.p2.y).addClass('room');
			descElement = floors[rectangle.floor].snap.text(rectangle.p1.x + 5, rectangle.p2.y + 15, rectangle.description).attr({class: 'desc'});
			sizeElement = floors[rectangle.floor].snap.text(rectangle.p1.x + 5, rectangle.p2.y + 28, rectangle.size() + "qm").attr({class: 'size'});
			break;
	}


	floors[rectangle.floor].snap.g(roomElement, descElement, sizeElement).attr({id: rooms.length});

	// pusing deep copy of rectangle into rooms array
	rooms.push( $.extend(true, {}, rectangle) );
}

function addLayerButton(floorname) {
	let btn = document.createElement('button');
	btn.innerText = floorname;
	btn.setAttribute('class', 'switch-layer');
	document.querySelector('.buttons').append(btn);
	btn.addEventListener('click', switchLayers);
}

function switchLayers() {
	let svgs = document.querySelectorAll('svg');
	let btnText = event.target.innerText;

	svgs.forEach( svg => svg.style.zIndex = "0" );
	svgs.forEach( svg => {
		if ( svg.getAttribute('class') === btnText ) { svg.style.zIndex = "100"; }
	});
}
