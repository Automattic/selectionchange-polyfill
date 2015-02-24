
/**
 * Module dependecies.
 */

import event from 'component-event';
import currentRange from 'current-range';
import rangeEquals from 'range-equals';

var ranges;

export function start (doc) {
  var d = doc || document;
  if (ranges || !hasNativeSupport(d) && (ranges = new WeakMap())) {
    if (!ranges.has(d)) {
      var range = currentRange(d);
      if (range) {
        ranges.set(d, flatten(range));
      }
      event.bind(d, 'keydown', onKeyDown);
      event.bind(d, 'mousedown', onMouseDown);
      event.bind(d, 'mousemove', onMouseMove);
      event.bind(d, 'mouseup', onMouseUp);
      event.bind(d.defaultView, 'focus', onFocus);
    }
  }
}

export function stop (doc) {
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

export function hasNativeSupport(doc) {
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

  // flatten the Range onto an Object first, so that it's "detached" from the DOM.
  // this fixes "backspace" in Firefox
  if (rNew) rNew = flatten(rNew);

  if (!rangeEquals(rNew, rOld)) {
    ranges.set(doc, rNew);
    setTimeout(doc.dispatchEvent.bind(doc, new Event('selectionchange')), 0);
  }
}

function flatten (range) {
  var r = {};
  r.startContainer = range.startContainer;
  r.startOffset = range.startOffset;
  r.endContainer = range.endContainer;
  r.endOffset = range.endOffset;
  return r;
}
