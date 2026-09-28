import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CONFIG } from "../config.ts";
import { formatOkb, mintCalldata, mintTransaction, mintValue, receiptOk } from "./mint.ts";
import { HORN, hornIds } from "../audio/whistle.ts";

const PRICE = 100000000000000n;
const FEE = 660000000000000n;

describe("transistor mint", () => {
  it("pays the on-chain unit price plus protocol fee to the transistor contract", () => {
    const from = "0x1234567890abcdef1234567890abcdef12345678";
    const tx = mintTransaction(from, PRICE, FEE);
    assert.equal(tx.to, CONFIG.transistors);
    assert.notEqual(tx.to.toLowerCase(), "0x000000000000000000000000000000000000dead");
    assert.equal(mintValue(PRICE, FEE), 760000000000000n);
    assert.equal(tx.value, "0x" + (760000000000000n).toString(16));
    assert.equal(
      tx.data,
      "0x1b2ef1ca" + "0".repeat(64) + "0".repeat(63) + "1",
    );
    assert.equal(mintCalldata(), tx.data);
    assert.equal(formatOkb(PRICE), "0.0001");
    assert.equal(formatOkb(FEE), "0.00066");
    assert.equal(formatOkb(mintValue(PRICE, FEE)), "0.00076");
  });

  it("only counts a success receipt", () => {
    assert.equal(receiptOk(null), null);
    assert.equal(receiptOk({ status: "0x1" }), true);
    assert.equal(receiptOk({ status: "0x0" }), false);
  });
});

describe("track horns", () => {
  it("gives every track a different first note", () => {
    const notes = hornIds.map((id) => HORN[id].freqs[0]);
    assert.equal(new Set(notes).size, hornIds.length);
    assert.ok(HORN.frontier.freqs[0]! > HORN.lite.freqs[0]!);
    assert.ok(HORN.refuse.ms < HORN.lite.ms);
  });
});
