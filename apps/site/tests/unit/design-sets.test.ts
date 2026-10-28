import { describe, expect, it } from "vitest";
import { SET_IDS, validateManifest, type SetManifest } from "../../src/design-sets/contract";
import { registry } from "../../src/design-sets/registry";

// manifest で宣言した形の名前の比較。見た目の判定（識別検査）の代わりではない
const CORE = ["s1", "s2", "s5"] as const;
const REST = ["s3", "s6", "s7", "s8", "s9"] as const;
const FORMATS = ["guide", "tutorial", "comparison", "news", "opinion", "interview"] as const;

function differ(a: SetManifest["signature"], b: SetManifest["signature"]) {
  return REST.filter((k) => a[k] !== b[k]).length;
}

describe("デザインセットの登録", () => {
  it("全セットが registry にあり、manifest の検査を通る", () => {
    for (const id of SET_IDS) {
      expect(registry[id].id).toBe(id);
      expect(validateManifest(registry[id])).toEqual([]);
    }
  });

  it("原形はセットごとに違う", () => {
    const primitives = SET_IDS.map((id) => registry[id].primitive);
    expect(new Set(primitives).size).toBe(primitives.length);
  });

  it("どの2つも S1・S2・S4・S5 の形が違い、残る5枠のうち3枠以上で違う", () => {
    for (const [i, a] of SET_IDS.entries()) {
      for (const b of SET_IDS.slice(i + 1)) {
        const sa = registry[a].signature;
        const sb = registry[b].signature;
        for (const k of CORE) expect(sa[k], `${a} と ${b} の ${k}`).not.toBe(sb[k]);
        for (const f of FORMATS) expect(sa.s4[f], `${a} と ${b} の s4.${f}`).not.toBe(sb.s4[f]);
        expect(differ(sa, sb), `${a} と ${b}`).toBeGreaterThanOrEqual(3);
      }
    }
  });
});
