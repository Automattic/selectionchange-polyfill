
/**
 * Module dependecies.
 */

var WeakMap = require('weakmap');
var event = require('component-event');
var currentRange = require('current-range');

/**
 * Module exports.
 */

exports.start = start;
exports.stop = stop;
exports.hasNativeSupport = hasNativeSupport;


var RANGE_PROPS = ['startContainer', 'startOffset', 'endContainer', 'endOffset'];

var ranges;

function start (doc) {
  var d = doc || document;
  if (ranges || !hasNativeSupport(d) && (ranges = new WeakMap())) {
    if (!ranges.has(d)) {
      ranges.set(d, currentRange(d));
      event.bind(d, 'keydown', onKeyDown);
      event.bind(d, 'mousedown', onMouseDown);
      event.bind(d, 'mousemove', onMouseMove);
      event.bind(d, 'mouseup', onMouseUp);
      event.bind(d.defaultView, 'focus', onFocus);
    }
  }
}

function stop (doc) {
  var d = doc || document;
  if (ranges && ranges.has(d)) {
    ranges['delete'](d);
    event.unbind(d, 'keydown', onKeyDown);
    event.unbind(d, 'mousedown', onMouseDown);
    event.unbind(d, 'mousemove', onMouseMove);
    event.unbind(d, 'mouseup', onMouseUp);
    event.unbind(d.defaultView, 'focus', onFocus);
  }
}

function hasNativeSupport(doc) {
  var osc = doc.onselectionchange;
  if (osc !== undefined) {
    try {
      doc.onselectionchange = 0;
      return doc.onselectionchange === null;
    } catch (e) {
    } finally {
      doc.onselectionchange = osc;
    }
  }
  return false;
}

function onKeyDown(e) {
  // any "keydown" event go ahead and check if the Selection has changed.
  // this catches regular keypresses in a contenteditable,
  // cmd + A for "select all",
  // cmd + Z for "undo",
  // directional arrows for moving around the cursor inside a contenteditable,
  // etc.
  setTimeout(dispatchIfChanged.bind(null, this), 0);
}

function onMouseDown(e) {
  if (e.button === 0) {
    event.bind(this, 'mousemove', onMouseMove);
    setTimeout(dispatchIfChanged.bind(null, this), 0);
  }
}

function onMouseMove(e) {  // only needed while primary button is down
  if (e.buttons & 1) {
    dispatchIfChanged(this);
  } else {
    event.unbind(this, 'mousemove', onMouseMove);
  }
}

function onMouseUp(e) {
  if (e.button === 0) {
    setTimeout(dispatchIfChanged.bind(null, this), 0);
  } else {
    event.unbind(this, 'mousemove', onMouseMove);
  }
}

function onFocus() {
  setTimeout(dispatchIfChanged.bind(null, this.document), 0);
}

function dispatchIfChanged(doc) {
  var rOld = ranges.get(doc);
  var rNew = currentRange(doc);
  if (!sameRange(rNew, rOld)) {
    ranges.set(doc, rNew);
    setTimeout(doc.dispatchEvent.bind(doc, new Event('selectionchange')), 0);
  }
}

function sameRange(r1, r2) {
  return r1 === r2 || r1 && r2 && RANGE_PROPS.every(function (prop) {
    return r1[prop] === r2[prop];
  });
}
