import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MINT_BATCH, MINT_TO, MINT_VALUE_WEI, mintCalldata, mintTransaction, receiptOk } from "./mint.ts";
import { HORN, hornIds } from "../audio/whistle.ts";

describe("transistor mint", () => {
  it("spends a real 0.001 OKB to the burn address and stamps the batch", () => {
    const tx = mintTransaction("0x1234567890abcdef1234567890abcdef12345678");
    assert.equal(tx.to, MINT_TO);
    assert.equal(tx.value, `0x${MINT_VALUE_WEI.toString(16)}`);
    assert.equal(MINT_VALUE_WEI, 10n ** 15n);
    assert.equal(mintCalldata(), "0x" + Buffer.from(`YIZHAN:MINT:${MINT_BATCH}`).toString("hex"));
    assert.notEqual(tx.to.toLowerCase(), tx.from.toLowerCase());
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
