// DOM
let DOM = {
	wrapper: document.querySelector('.svg-wrapper'),
	svg: document.querySelector('.svg'), 
	buttonRoom: document.querySelector('#room-tool'),
	buttonDoor: document.querySelector('#door-tool')
};


// GLOBALS
let snap = Snap('.svg');

let gridSize = 20;
let mode;

let rooms = [];

let pointerCircle;
let previewRectangle;

let pos = {	x: undefined, y: undefined };

let rectangle = {
	doors: 0,
	windows: 0,
	usage: undefined,
	p1: { 
		x: undefined, 
		y: undefined 
	},
	p2: { 
		x: undefined, 
		y: undefined 
	}
};


// EVENT HANDLER
DOM.svg.addEventListener('mousemove', moveHandler);
DOM.svg.addEventListener('mousemove', livePreview);

DOM.svg.addEventListener('mousedown', mouseDownHandler);
DOM.svg.addEventListener('mouseup', mouseUpHandler);

DOM.svg.addEventListener('click', clickHandler);


// FUNCTIONS
(function init() {
	// drawing grid
	let width = DOM.svg.getBoundingClientRect().width;
	let height = DOM.svg.getBoundingClientRect().height;

	let group = snap.g().attr({class: 'lines'});
	for (let i = gridSize; i <= width; i += gridSize) {
		group.add(snap.line(i, 0, i, height).attr({ stroke: '#efefef'}));
		group.add(snap.line(0, i, width, i).attr({ stroke: '#efefef'}));
	}

	// previewRectangle
	previewRectangle = snap.rect(-50, -50, gridSize, gridSize).attr({class: 'preview'});

	// pointerCircle
	pointerCircle = snap.ellipse(-50, -50, 2.5, 2.5).attr({class: 'pointer'})
})();

function clickHandler() {
	if ( event.target.getAttribute('class') === "room" && rooms.length > 0 ) {
		rooms.forEach( room => {
			if ( isEdge(room, pos) === "vertical" ) {
				room.doors += 1;
				addDoor(pos, "vertical");
			}
			if ( isEdge(room, pos) === "horizontal" ) {
				room.doors += 1;
				addDoor(pos, "horizontal");
			}
		});
	}
}

function moveHandler(event) {
	// substracting the coordinates of the svg element from the coordinates of the mouse click event.
	// position gets rounded up to a mutltiple of 20 to fit the grid size
	pos.x = Math.round( (event.x - this.getBoundingClientRect().x) / gridSize) * gridSize;
	pos.y = Math.round( (event.y - this.getBoundingClientRect().y) / gridSize) * gridSize;

	if (mode === "drawing") {
		rectangle.p2.x = pos.x;
		rectangle.p2.y = pos.y;
	}

	// updating position of the pointercircle
	pointerCircle.attr({ cx: pos.x, cy: pos.y });
}

function livePreview() {
	if (mode === "drawing") {
		if (isValidRectangle(rectangle)) {
			// top left -> bottom right
			if (rectangle.p1.x < rectangle.p2.x && rectangle.p1.y < rectangle.p2.y) {
				previewRectangle.attr({ x: rectangle.p1.x, y: rectangle.p1.y, width: rectangle.p2.x - rectangle.p1.x, height: rectangle.p2.y - rectangle.p1.y });
			}
			// bottom right -> top left
			if (rectangle.p1.x > rectangle.p2.x && rectangle.p1.y > rectangle.p2.y) {
				previewRectangle.attr({ x: rectangle.p2.x, y: rectangle.p2.y, width: rectangle.p1.x - rectangle.p2.x, height: rectangle.p1.y - rectangle.p2.y });
			}
			// top right -> bottom left
			if (rectangle.p1.x > rectangle.p2.x && rectangle.p1.y < rectangle.p2.y) {
				previewRectangle.attr({ x: rectangle.p2.x, y: rectangle.p1.y, width: rectangle.p1.x - rectangle.p2.x, height: rectangle.p2.y - rectangle.p1.y });
			}
			// bottom left -> top right
			if (rectangle.p1.x < rectangle.p2.x && rectangle.p1.y > rectangle.p2.y) {
				previewRectangle.attr({ x: rectangle.p1.x, y: rectangle.p2.y, width: rectangle.p2.x - rectangle.p1.x, height: rectangle.p1.y - rectangle.p2.y });
			}
		} else {
			previewRectangle.attr({ x: -500, y: -500 });
		}
	} else {
		previewRectangle.attr({ x: -500, y: -500 });
	}
}

function mouseDownHandler(event) {
	drawRectangle("start", pos);
}

function mouseUpHandler(event) {
	drawRectangle("stop", pos);
}

function drawRectangle(action, pos) {
	if (action === "start") {
		mode = "drawing";
		rectangle.p1.x = pos.x;
		rectangle.p1.y = pos.y;
	}

	if (action === "stop") {
		mode = "idle";
		rectangle.p2.x = pos.x;
		rectangle.p2.y = pos.y;

		// mode the rectangle
		if ( isValidRectangle(rectangle) ) {
			if (rectangle.p1.x < rectangle.p2.x && rectangle.p1.y < rectangle.p2.y) {
				let desc = window.prompt("Zweck des Zimmers?");
				let size = (rectangle.p2.x - rectangle.p1.x) * (rectangle.p2.y - rectangle.p1.y) / 400;

				let roomElement = snap.rect(rectangle.p1.x, rectangle.p1.y, rectangle.p2.x - rectangle.p1.x, rectangle.p2.y - rectangle.p1.y).attr({class: 'room'});
				let descElement = snap.text(rectangle.p1.x + 5, rectangle.p1.y + 15, desc).attr({class: 'desc'});
				let sizeElement = snap.text(rectangle.p1.x + 5, rectangle.p1.y + 30, size + "qm").attr({class: 'size'});

				let group = snap.g(roomElement, descElement, sizeElement).attr({id: rooms.length});

				rectangle.usage = desc;
				// pusing deep copy of rectangle into rooms array
				rooms.push(JSON.parse(JSON.stringify(rectangle)));
			}
			if (rectangle.p1.x > rectangle.p2.x && rectangle.p1.y > rectangle.p2.y) {
				snap.rect(rectangle.p2.x, rectangle.p2.y, rectangle.p1.x - rectangle.p2.x, rectangle.p1.y - rectangle.p2.y).addClass('room');
			}
			if (rectangle.p1.x > rectangle.p2.x && rectangle.p1.y < rectangle.p2.y) {
				snap.rect(rectangle.p2.x, rectangle.p1.y, rectangle.p1.x - rectangle.p2.x, rectangle.p2.y - rectangle.p1.y).addClass('room');
			}
			if (rectangle.p1.x < rectangle.p2.x && rectangle.p1.y > rectangle.p2.y) {
				snap.rect(rectangle.p1.x, rectangle.p2.y, rectangle.p2.x - rectangle.p1.x, rectangle.p1.y - rectangle.p2.y).addClass('room');
			}
		}
	}
}

function addDoor(pos, rotation) {
	rotation === "vertical" && snap.rect(pos.x - gridSize / 4, pos.y - gridSize / 4, 10, 10).attr({class: 'door'}).transform( 'r45,' +pos.x + "," +pos.y );
	rotation === "horizontal" && snap.rect(pos.x - gridSize / 4, pos.y - gridSize / 4, 10, 10).attr({class: 'door'}).transform( 'r45,' +pos.x + "," +pos.y );
}

function isEdge(room, pos) {
	if (room.p1.x === pos.x || room.p2.x === pos.x ) {
		return "vertical";
	} 
	
	if (room.p1.y === pos.y || room.p2.y === pos.y) {
		return "horizontal";
	}
	
	return false;
}

function isValidRectangle(rectangle) {
	return rectangle.p1.x !== rectangle.p2.x || rectangle.p1.y !== rectangle.p2.y;
}