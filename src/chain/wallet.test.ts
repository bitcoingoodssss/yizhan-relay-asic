import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  asAccounts,
  ensureXLayer,
  formatOkb,
  isUserRejected,
  parseChainId,
  parseWei,
  readOkb,
  shortenAddress,
  XLAYER_CHAIN_ID,
  type Eip1193,
} from "./wallet.ts";

describe("wallet helpers", () => {
  it("parses chain ids and addresses", () => {
    assert.equal(parseChainId("0xc4"), 196);
    assert.equal(parseChainId("0x1"), 1);
    assert.equal(parseChainId(196), 196);
    assert.equal(parseChainId("nope"), null);
    assert.equal(shortenAddress("0x1234567890abcdef1234567890abcdef12345678"), "0x1234…5678");
    assert.deepEqual(asAccounts(["0x1234567890abcdef1234567890abcdef12345678", "nope"]), [
      "0x1234567890abcdef1234567890abcdef12345678",
    ]);
  });

  it("formats OKB from wei", () => {
    assert.equal(formatOkb(0n), "0.0000");
    assert.equal(formatOkb(parseWei("0x0")), "0.0000");
    assert.equal(formatOkb(15n * 10n ** 17n), "1.5000");
    assert.equal(formatOkb(10n ** 14n), "0.0001");
  });

  it("switches to X Layer and adds the chain when it is missing", async () => {
    const calls: string[] = [];
    let chain = "0x1";
    const provider: Eip1193 = {
      request: async ({ method }) => {
        calls.push(method);
        if (method === "eth_chainId") return chain;
        if (method === "wallet_switchEthereumChain") {
          const error = new Error("missing") as Error & { code: number };
          error.code = 4902;
          throw error;
        }
        if (method === "wallet_addEthereumChain") {
          chain = "0xc4";
          return null;
        }
        throw new Error(method);
      },
    };
    assert.equal(await ensureXLayer(provider), XLAYER_CHAIN_ID);
    assert.deepEqual(calls, ["eth_chainId", "wallet_switchEthereumChain", "wallet_addEthereumChain", "eth_chainId"]);
  });

  it("does not add the chain when the user rejects the switch", async () => {
    const provider: Eip1193 = {
      request: async ({ method }) => {
        if (method === "eth_chainId") return "0x1";
        const error = new Error("no") as Error & { code: number };
        error.code = 4001;
        throw error;
      },
    };
    await assert.rejects(ensureXLayer(provider), (error: unknown) => isUserRejected(error));
  });

  it("reads a balance only as OKB wei", async () => {
    const provider: Eip1193 = {
      request: async () => "0xde0b6b3a7640000",
    };
    assert.equal(await readOkb(provider, "0x1234567890abcdef1234567890abcdef12345678"), "1.0000");
  });
});
