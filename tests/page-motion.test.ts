import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

type Listener = (event: Record<string, unknown>) => void;
class Events {
  listeners = new Map<string, Listener[]>();
  addEventListener(type: string, listener: Listener) {
    this.listeners.set(type, [...(this.listeners.get(type) || []), listener]);
  }
  emit(type: string, event: Record<string, unknown>) {
    for (const listener of this.listeners.get(type) || [])
      listener({ type, ...event });
  }
}

function setup() {
  const document = new Events() as Events & {
    documentElement: { dataset: Record<string, string> };
  };
  document.documentElement = { dataset: {} };
  const window = new Events();
  const values = new Map<string, string>();
  const sessionStorage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
  runInNewContext(
    readFileSync("public/assets/page-motion.js", "utf8"),
    {
      document,
      window,
      sessionStorage,
      URL,
      Date,
      Number,
      location: {
        href: "https://dockfold.vercel.app/",
        origin: "https://dockfold.vercel.app",
        pathname: "/",
        search: "",
      },
    },
  );
  const link = {
    href: "https://dockfold.vercel.app/latest",
    target: "",
    hasAttribute: () => false,
  };
  const click = (detail: number) =>
    document.emit("click", {
      target: { closest: () => link },
      detail,
      button: 0,
      defaultPrevented: false,
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
    });
  const transition = () => {
    let skips = 0;
    return {
      viewTransition: { skipTransition: () => skips++ },
      skips: () => skips,
    };
  };
  return { document, window, values, click, transition };
}

test("keyboard link navigation skips both sides of the document transition", () => {
  const { document, window, values, click, transition } = setup();
  click(0);
  const outgoing = transition();
  window.emit("pageswap", outgoing);
  assert.equal(outgoing.skips(), 1);
  const incoming = transition();
  window.emit("pagereveal", incoming);
  assert.equal(incoming.skips(), 1);
  assert.equal(values.size, 0);
  assert.equal(document.documentElement.dataset.navigationInput, undefined);
});

test("typing does not disable a later pointer navigation", () => {
  const { document, window, click, transition } = setup();
  document.emit("keydown", {
    key: "f",
    altKey: false,
    ctrlKey: false,
    metaKey: false,
  });
  click(1);
  const navigation = transition();
  window.emit("pageswap", navigation);
  assert.equal(navigation.skips(), 0);
});

test("pointer navigation clears a cancelled keyboard-navigation marker", () => {
  const { window, click, transition } = setup();
  click(0);
  click(1);
  const navigation = transition();
  window.emit("pageswap", navigation);
  assert.equal(navigation.skips(), 0);
});

test("browser back and forward keyboard chords skip motion", () => {
  const { document, window, transition } = setup();
  document.emit("keydown", {
    key: "ArrowLeft",
    altKey: true,
    ctrlKey: false,
    metaKey: false,
  });
  const navigation = transition();
  window.emit("pageswap", navigation);
  assert.equal(navigation.skips(), 1);
});
