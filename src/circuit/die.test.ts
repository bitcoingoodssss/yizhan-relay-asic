import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evalRelay } from "./relay.ts";
import { diePads } from "./die.ts";

describe("die pads", () => {
  it("changes the metal pattern when the track changes", () => {
    const locked = evalRelay({ model: 2, paid: false, burst: false, risk: false, ticketOk: false });
    const express = evalRelay({ model: 2, paid: true, burst: false, risk: false, ticketOk: false });
    const a = diePads(locked, false, false).join("");
    const b = diePads(express, true, false).join("");
    assert.notEqual(a, b);
    assert.equal(diePads(locked, false, false).length, 32);
  });
});
