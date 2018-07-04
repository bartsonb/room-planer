// DOM
let DOM = {
	wrapper: document.querySelector('.svg-wrapper'),
	svg: document.querySelector('.svg'),
	dropdown: {
		box: document.querySelector('.select-dialog'),
		select: document.querySelector('.select-description'),
		submit: document.querySelector('.select-submit')
	},
	button: {
		room: document.querySelector('#room-tool'),
		door: document.querySelector('#door-tool'),
		window: document.querySelector('#window-tool'),
		delete: document.querySelector('#delete-tool')
	}
};


// GLOBALS
let snap = Snap('.svg');

let gridSize = 20;
let mode;
let tool;

let rooms = [];

let pointerCircle;
let previewRectangle;

let pos = {
	x: undefined,
	y: undefined
};

let rectangle = {
	doors: 0,
	windows: 0,
	story: 1,
	description: undefined,
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
	getDirection() {
		if (this.p1.x < this.p2.x && this.p1.y < this.p2.y) { return "top-left-bottom-right" }
		if (this.p1.x > this.p2.x && this.p1.y > this.p2.y) { return "bottom-right-top-left" }
		if (this.p1.x > this.p2.x && this.p1.y < this.p2.y) { return "top-right-bottom-left" }
		if (this.p1.x < this.p2.x && this.p1.y > this.p2.y) { return "bottom-left-top-right" }
	}
};


// EVENT HANDLER
DOM.svg.addEventListener('mousemove', moveHandler);
DOM.svg.addEventListener('mousemove', livePreview);

DOM.svg.addEventListener('mousedown', mouseDownHandler);
DOM.svg.addEventListener('mouseup', mouseUpHandler);

DOM.svg.addEventListener('click', clickHandler);

Object.keys(DOM.button).forEach( key => {
	DOM.button[key].addEventListener('click', buttonHandler);
});


// FUNCTIONS
(function init() {
	// set mode
	mode = "idle";

	// set tool 
	if ( DOM.button.room.checked ) { tool = "room" }

	// drawing grid
	let width = DOM.svg.getBoundingClientRect().width;
	let height = DOM.svg.getBoundingClientRect().height;
	let lines = snap.g().attr({	class: 'lines' });

	for (let i = gridSize; i <= width; i += gridSize) {
		lines.add(snap.line(i, 0, i, height).attr({	stroke: '#efefef' }));
	}

	for (let i = gridSize; i <= height; i+= gridSize) {
		lines.add(snap.line(0, i, width, i).attr({ stroke: '#efefef' }));
	}

	// previewRectangle
	previewRectangle = snap.rect(-50, -50, gridSize, gridSize).attr({ class: 'preview' });

	// pointerCircle
	pointerCircle = snap.ellipse(-50, -50, 2.5, 2.5).attr({ class: 'pointer' });
})();

function buttonHandler(event) {
	// get tool name from radiobutton id 
	tool = event.target.id.split("-")[0];
}

function clickHandler() {
	console.log(pos.x + ", " + pos.y);

	if (tool === "door") {
		rooms.forEach(room => {
			if (isSide(room, pos) === "vertical") { addDoor(pos, room, "vertical") }
			if (isSide(room, pos) === "horizontal") { addDoor(pos, room, "horizontal") }
		});
	}

	if (tool === "window") {
		rooms.forEach(room => {
			if (isSide(room, pos) === "vertical") { addWindow(pos, room, "vertical") }
			if (isSide(room, pos) === "horizontal") { addWindow(pos, room, "horizontal") }
		});
	}

	// if (tool === "delete") {
	// 	if (event.target.tagName !== "svg" && event.target.tagName !== "line" && event.target.tagName !== "ellipse") {
	// 		event.target.remove();
	// 	}
	// }
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

	// updating position of the pointercircle
	pointerCircle.attr({ cx: pos.x, cy: pos.y });
}

function livePreview() {
	if (mode === "drawing") {
		if ( rectangle.isValid() ) {
			switch ( rectangle.getDirection() ) {
				case "top-left-bottom-right":
					previewRectangle.attr({ x: rectangle.p1.x, y: rectangle.p1.y, width: rectangle.width(), height: rectangle.height() });
					break;
				case "bottom-right-top-left":
					previewRectangle.attr({ x: rectangle.p2.x, y: rectangle.p2.y, width: rectangle.width(), height: rectangle.height() });
					break;
				case "top-right-bottom-left":
					previewRectangle.attr({ x: rectangle.p2.x, y: rectangle.p1.y, width: rectangle.width(), height: rectangle.height() });
					break;
				case "bottom-left-top-right":
					previewRectangle.attr({ x: rectangle.p1.x, y: rectangle.p2.y, width: rectangle.width(), height: rectangle.height() });
					break;
			}
		} else {
			previewRectangle.attr({x: -500, y: -500});
		}
	} else {
		previewRectangle.attr({x: -500,	y: -500});
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

function addDoor(pos, room, rotation) {
	if (rotation === "vertical") { room.doors += 1; snap.rect(pos.x - 5, pos.y - 3, 10, 6).addClass('door'); }
	if (rotation === "horizontal") { room.doors += 1; snap.rect(pos.x - 5, pos.y - 3, 10, 6).addClass('door').transform('r90'); }
}

function addWindow(pos, room, rotation) {
	if (rotation === "vertical") { room.windows += 1; snap.rect(pos.x - 5, pos.y - 3, 10, 6).addClass('window'); }
	if (rotation === "horizontal") { room.windows += 1; snap.rect(pos.x - 5, pos.y - 3, 10, 6).addClass('window').transform('r90'); }
}

function isSide(room, pos) {
	if (pos.x > room.p1.x && pos.x < room.p2.x && ( pos.y === room.p1.y || pos.y === room.p2.y ) ) { return "vertical" }
	if (pos.y > room.p1.y && pos.y < room.p2.y && ( pos.x === room.p1.x || pos.x === room.p2.x ) ) { return "horizontal"; }

	return false;
}

function addRoom(direction) {
	rectangle.description = window.prompt("Zweck des Zimmers?");
	let roomElement, descElement, sizeElement;

	switch (direction) {
		case "top-left-bottom-right":
			roomElement = snap.rect(rectangle.p1.x, rectangle.p1.y, rectangle.p2.x - rectangle.p1.x, rectangle.p2.y - rectangle.p1.y).attr({class: 'room'});
			descElement = snap.text(rectangle.p1.x + 5, rectangle.p1.y + 15, rectangle.description).attr({class: 'desc'});
			sizeElement = snap.text(rectangle.p1.x + 5, rectangle.p1.y + 28, rectangle.size() + "qm").attr({class: 'size'});
			break;

		case "bottom-right-top-left":
			roomElement = snap.rect(rectangle.p2.x, rectangle.p2.y, rectangle.p1.x - rectangle.p2.x, rectangle.p1.y - rectangle.p2.y).addClass('room');
			descElement = snap.text(rectangle.p2.x + 5, rectangle.p2.y + 15, rectangle.description).attr({class: 'desc'});
			sizeElement = snap.text(rectangle.p2.x + 5, rectangle.p2.y + 28, rectangle.size() + "qm").attr({class: 'size'});
			break;

		case "top-right-bottom-left":
			roomElement = snap.rect(rectangle.p2.x, rectangle.p1.y, rectangle.p1.x - rectangle.p2.x, rectangle.p2.y - rectangle.p1.y).addClass('room'); 			descElement = snap.text(rectangle.p2.x + 5, rectangle.p1.y + 15, rectangle.description).attr({class: 'desc'});
			sizeElement = snap.text(rectangle.p2.x + 5, rectangle.p1.y + 28, rectangle.size() + "qm").attr({class: 'size'});
			break;

		case "bottom-left-top-right":
			roomElement = snap.rect(rectangle.p1.x, rectangle.p2.y, rectangle.p2.x - rectangle.p1.x, rectangle.p1.y - rectangle.p2.y).addClass('room');
			descElement = snap.text(rectangle.p1.x + 5, rectangle.p2.y + 15, rectangle.description).attr({class: 'desc'});
			sizeElement = snap.text(rectangle.p1.x + 5, rectangle.p2.y + 28, rectangle.size() + "qm").attr({class: 'size'});
			break;
	}


	snap.g(roomElement, descElement, sizeElement).attr({id: rooms.length});

	// pusing deep copy of rectangle into rooms array
	rooms.push(JSON.parse(JSON.stringify(rectangle)));
}