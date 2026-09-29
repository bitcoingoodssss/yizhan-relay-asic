import assert from "node:assert/strict";
import test from "node:test";
import { evalRelay } from "../circuit/relay.ts";
import { ROAD_TEST, frameAt, senseToRelay } from "./map.ts";

test("road test hits assist, cruise, highway, fallback, then a hazard lock", () => {
  const actions = ROAD_TEST.map((frame) => evalRelay(senseToRelay(frame.sense)).action);
  assert.deepEqual(actions, ["lite", "std", "frontier", "degraded", "refuse", "lite"]);
});

test("a missing speed does not invent congestion", () => {
  const word = senseToRelay({ speedKmh: null, accel: 0, yaw: 0, requested: 2, paid: true, ticketOk: false });
  assert.equal(word.burst, false);
  assert.equal(evalRelay(word).action, "frontier");
});

test("frameAt holds the last scene", () => {
  assert.equal(frameAt(0).scene, "park");
  assert.equal(frameAt(10_000).scene, "highway");
  assert.equal(frameAt(30_000).scene, "recover");
});
