import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ModelTier, RelayInput } from "./types.ts";
import { evalRelay } from "./relay.ts";
import { hexOf, relayNetlist, sampleNandNetlist, simulateRelay } from "./netlist.ts";

describe("tapeout netlist", () => {
  it("matches the NAND circuit that was taped out as 2.2.250", () => {
    assert.equal(hexOf(sampleNandNetlist()), "0x000000020000030000000400000400000005000005");
  });

  it("uses 27 NAND gates and matches evalRelay on all 48 inputs", () => {
    const net = relayNetlist();
    assert.equal(net.nIn, 6);
    assert.equal(net.nOut, 4);
    assert.equal(net.nand, 27);
    assert.equal(net.bytes.length, 189);
    for (const model of [0, 1, 2] as ModelTier[]) {
      for (const paid of [false, true]) {
        for (const burst of [false, true]) {
          for (const risk of [false, true]) {
            for (const ticketOk of [false, true]) {
              const input: RelayInput = { model, paid, burst, risk, ticketOk };
              const soft = evalRelay(input);
              const hard = simulateRelay(input);
              assert.equal(hard.allow, soft.allow);
              assert.equal(hard.degrade, soft.degrade);
              assert.equal(hard.refuse, soft.refuse);
              assert.equal(hard.tierHi, soft.tierHi);
            }
          }
        }
      }
    }
  });
});
