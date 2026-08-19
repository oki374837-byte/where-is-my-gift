import { describe, expect, it } from "vitest";

import { getInventoryDefinitions, getInventoryTotal, ITEM_CATALOG, ITEM_CATEGORIES } from "../lib/item-catalog";

describe("item catalog", () => {
  it("keeps store and inventory definitions in one catalog", () => {
    expect(ITEM_CATALOG.map((item) => item.id)).toEqual(["crystal", "map", "seed"]);
    expect(ITEM_CATEGORIES).toContain("الكل");
    expect(ITEM_CATEGORIES).toContain("عنصر نادر");
  });

  it("calculates inventory totals and ignores unknown zero quantities", () => {
    expect(getInventoryTotal({ crystal: 3, map: 2, seed: 0 })).toBe(5);
    expect(getInventoryDefinitions({ crystal: 3, unknown: 1 })).toHaveLength(2);
    expect(getInventoryDefinitions({ crystal: 0 })).toHaveLength(0);
  });
});
