// DOM
var DOM = {
	wrapper: document.querySelector('.svg-wrapper'),
	svg: document.querySelector('.svg'), 
	buttonDoor: document.querySelector('.door')
};


// GLOBALS
var snap = Snap('.svg');

var gridSize = 20;
var mode = "idle";

var pointerCircle = snap.ellipse(-50, -50, 2.5, 2.5).attr({class: 'pointer'});
var previewRectangle = snap.rect(-50, -50, gridSize, gridSize).attr({class: 'preview'});

var pos = {	x: undefined, y: undefined };

var points = {
	p1: { x: undefined, y: undefined },
	p2: { x: undefined, y: undefined }
};


// EVENT HANDLER
DOM.svg.addEventListener('mousemove', moveHandler);
DOM.svg.addEventListener('mousemove', livePreview);
DOM.svg.addEventListener('mousedown', mouseDownHandler);
DOM.svg.addEventListener('mouseup', mouseUpHandler);


// FUNCTIONS
function moveHandler(event) {
	// substracting the coordinates of the svg element from the coordinates of the mouse click event.
	// position gets rounded up to a mutltiple of 20 to fit the grid size
	pos.x = Math.round( (event.x - this.getBoundingClientRect().x) / gridSize) * gridSize;
	pos.y = Math.round( (event.y - this.getBoundingClientRect().y) / gridSize) * gridSize;

	if (mode === "drawing") {
		points.p2.x = pos.x;
		points.p2.y = pos.y;
	}

	// updating position of the pointercircle
	pointerCircle.attr({ cx: pos.x, cy: pos.y });
}

function livePreview() {
	if (mode === "drawing") {
		if (isValidRectangle(points)) {
			// top left -> bottom right
			if (points.p1.x < points.p2.x && points.p1.y < points.p2.y) {
				previewRectangle.attr({ x: points.p1.x, y: points.p1.y, width: points.p2.x - points.p1.x, height: points.p2.y - points.p1.y });
			}
			// bottom right -> top left
			if (points.p1.x > points.p2.x && points.p1.y > points.p2.y) {
				previewRectangle.attr({ x: points.p2.x, y: points.p2.y, width: points.p1.x - points.p2.x, height: points.p1.y - points.p2.y });
			}
			// top right -> bottom left
			if (points.p1.x > points.p2.x && points.p1.y < points.p2.y) {
				previewRectangle.attr({ x: points.p2.x, y: points.p1.y, width: points.p1.x - points.p2.x, height: points.p2.y - points.p1.y });
			}
			// bottom left -> top right
			if (points.p1.x < points.p2.x && points.p1.y > points.p2.y) {
				previewRectangle.attr({ x: points.p1.x, y: points.p2.y, width: points.p2.x - points.p1.x, height: points.p1.y - points.p2.y });
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
		points.p1.x = pos.x;
		points.p1.y = pos.y;
	}

	if (action === "stop") {
		mode = "idle";
		points.p2.x = pos.x;
		points.p2.y = pos.y;

		// mode the rectangle
		if ( isValidRectangle(points) ) {
			comparePoints(points, snap.rect());
			if (points.p1.x < points.p2.x && points.p1.y < points.p2.y) {
				var desc = window.prompt("Zweck des Zimmers?");
				var size = (points.p2.x - points.p1.x) * (points.p2.y - points.p1.y) / 400;

				var roomElement = snap.rect(points.p1.x, points.p1.y, points.p2.x - points.p1.x, points.p2.y - points.p1.y).attr({class: 'room'});
				var descElement = snap.text(points.p1.x + 3, points.p1.y + 15, desc).attr({class: 'desc'});
				var sizeElement = snap.text(points.p1.x + 3, points.p1.y + 30, size + "qm").attr({class: 'size'});

				snap.g(roomElement, descElement, sizeElement).attr({id: rectangles.length});
			}
			if (points.p1.x > points.p2.x && points.p1.y > points.p2.y) {
				snap.rect(points.p2.x, points.p2.y, points.p1.x - points.p2.x, points.p1.y - points.p2.y).addClass('room');
			}
			if (points.p1.x > points.p2.x && points.p1.y < points.p2.y) {
				snap.rect(points.p2.x, points.p1.y, points.p1.x - points.p2.x, points.p2.y - points.p1.y).addClass('room');
			}
			if (points.p1.x < points.p2.x && points.p1.y > points.p2.y) {
				snap.rect(points.p1.x, points.p2.y, points.p2.x - points.p1.x, points.p1.y - points.p2.y).addClass('room');
			}
		}
	}
}

function isValidRectangle(points) {
	return points.p1.x !== points.p2.x || points.p1.y !== points.p2.y;
}