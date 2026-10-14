import assert from "node:assert/strict";
import test from "node:test";
import { lockGestureSelection } from "./gestureSelection.web";

class FakeElement extends EventTarget {
  constructor(readonly editable = false) {
    super();
  }
  closest() {
    return this.editable ? this : null;
  }
}

test("la guardia bloquea texto durante el gesto, conserva inputs y se restaura al finalizar", () => {
  const fakeDocument = new EventTarget();
  const fakeWindow = new EventTarget();
  let hidden = false;
  let cleared = 0;
  Object.assign(fakeDocument, {
    getSelection: () => ({ removeAllRanges: () => cleared++ }),
  });
  Object.defineProperty(fakeDocument, "hidden", { get: () => hidden });
  const previous = ["document", "window", "Element"].map((key) => ({
    key,
    descriptor: Object.getOwnPropertyDescriptor(globalThis, key),
  }));
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: fakeDocument,
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: fakeWindow,
  });
  Object.defineProperty(globalThis, "Element", {
    configurable: true,
    value: FakeElement,
  });
  try {
    let cancellations = 0;
    const release = lockGestureSelection(() => cancellations++);
    assert.equal(cleared, 1);
    const select = new Event("selectstart", { cancelable: true });
    fakeDocument.dispatchEvent(select);
    assert.equal(select.defaultPrevented, true);
    const editable = new Event("selectstart", { cancelable: true });
    Object.defineProperty(editable, "target", { value: new FakeElement(true) });
    fakeDocument.dispatchEvent(editable);
    assert.equal(editable.defaultPrevented, false);
    const escape = new Event("keydown", { cancelable: true });
    Object.assign(escape, { key: "Escape" });
    fakeDocument.dispatchEvent(escape);
    assert.equal(cancellations, 1);
    fakeWindow.dispatchEvent(new Event("blur"));
    assert.equal(cancellations, 2);
    hidden = true;
    fakeDocument.dispatchEvent(new Event("visibilitychange"));
    assert.equal(cancellations, 3);
    release();
    release();
    const after = new Event("selectstart", { cancelable: true });
    fakeDocument.dispatchEvent(after);
    assert.equal(after.defaultPrevented, false);
    fakeWindow.dispatchEvent(new Event("blur"));
    fakeDocument.dispatchEvent(escape);
    fakeDocument.dispatchEvent(new Event("visibilitychange"));
    assert.equal(cancellations, 3);
  } finally {
    for (const { key, descriptor } of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
