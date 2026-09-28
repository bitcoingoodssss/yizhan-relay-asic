import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { enumerateRelay, wiresMatch } from "./explain.ts";
import { COPY } from "../i18n/copy.ts";
import { narrate } from "./narrate.ts";
import { evalRelay, RELAY_TRUTH_CASES } from "./relay.ts";
import { evalTicket } from "./ticket.ts";
import type { RelayOutput } from "./types.ts";
import { runMobileProof } from "../pow/mobileProof.ts";

const GOLDEN: RelayOutput[] = [
  { allow: true, degrade: false, refuse: false, tierHi: false, action: "lite" },
  { allow: false, degrade: false, refuse: true, tierHi: false, action: "refuse" },
  { allow: true, degrade: false, refuse: false, tierHi: true, action: "frontier" },
  { allow: true, degrade: true, refuse: false, tierHi: false, action: "degraded" },
  { allow: false, degrade: false, refuse: true, tierHi: false, action: "refuse" },
  { allow: true, degrade: false, refuse: false, tierHi: true, action: "frontier" },
];

describe("evalRelay", () => {
  it("matches the six spec cases", () => {
    assert.equal(RELAY_TRUTH_CASES.length, GOLDEN.length);
    RELAY_TRUTH_CASES.forEach((item, index) => {
      assert.deepEqual(evalRelay(item.in), GOLDEN[index]);
    });
  });

  it("keeps std, burst-on-lite, and risk-on-lite", () => {
    assert.deepEqual(evalRelay({ model: 1, paid: true, burst: false, risk: false, ticketOk: false }), {
      allow: true,
      degrade: false,
      refuse: false,
      tierHi: false,
      action: "std",
    });
    assert.equal(evalRelay({ model: 0, paid: false, burst: true, risk: false, ticketOk: false }).action, "lite");
    assert.equal(evalRelay({ model: 0, paid: true, burst: false, risk: true, ticketOk: true }).action, "refuse");
  });

  it("holds the action and wire invariants on all 48 words", () => {
    const rows = enumerateRelay();
    assert.equal(rows.length, 48);
    for (const row of rows) {
      const o = row.out;
      assert.equal(o.refuse, !o.allow);
      assert.equal(o.degrade, o.allow && row.in.burst && row.in.model !== 0);
      assert.equal(o.tierHi, o.allow && !o.degrade && row.in.model === 2);
      if (!o.allow) assert.equal(o.action, "refuse");
      else if (o.degrade) assert.equal(o.action, "degraded");
      else if (row.in.model === 0) assert.equal(o.action, "lite");
      else if (row.in.model === 1) assert.equal(o.action, "std");
      else assert.equal(o.action, "frontier");
      assert.equal(wiresMatch(row.in), true);
      const said = narrate(row.in, o);
      assert.ok(COPY.zh.narration[said].length > 8);
      assert.ok(COPY.en.narration[said].length > 8);
    }
  });

  it("names every spec case in both languages", () => {
    for (const item of RELAY_TRUTH_CASES) {
      assert.equal(item.note in COPY.zh.cases, true);
      assert.equal(item.note in COPY.en.cases, true);
    }
  });
});

describe("evalTicket", () => {
  it("is valid only when ok and mobile", () => {
    assert.deepEqual(evalTicket({ ok: true, mobile: true }), { valid: true });
    assert.equal(evalTicket({ ok: true, mobile: false }).valid, false);
    assert.equal(evalTicket({ ok: false, mobile: true }).valid, false);
  });
});

describe("runMobileProof", () => {
  it("finds a 000 prefix for yizhan inside the time box", async () => {
    const result = await runMobileProof("yizhan");
    assert.equal(result.ok, true);
    assert.ok(result.nonce >= 0);
    assert.equal(result.hash.startsWith("000"), true);
  });
});
