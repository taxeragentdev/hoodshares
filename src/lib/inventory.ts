import type { OpenedCard } from "./packs";

export const INVENTORY_STORAGE_KEY = "hoodshares.inventory.v1";

export interface Inventory {
  /** Unopened sealed packs. On-chain these are the ERC-1155. */
  packs: number;
  /** Opened cards, keyed by `CardDefinition.id`. Off-chain for gameplay. */
  cards: Record<string, number>;
}

export const EMPTY_INVENTORY: Inventory = { packs: 0, cards: {} };

export function totalCards(inventory: Inventory): number {
  return Object.values(inventory.cards).reduce((sum, n) => sum + n, 0);
}

export function copiesOf(inventory: Inventory, cardId: string): number {
  return inventory.cards[cardId] ?? 0;
}

export function creditPacks(inventory: Inventory, quantity: number): Inventory {
  return { ...inventory, packs: inventory.packs + quantity };
}

export function applyOpenedPack(inventory: Inventory, opened: OpenedCard[]): Inventory {
  if (inventory.packs < 1) return inventory;
  const cards = { ...inventory.cards };
  for (const item of opened) {
    cards[item.card.id] = (cards[item.card.id] ?? 0) + 1;
  }
  return { packs: inventory.packs - 1, cards };
}

export function loadInventory(): Inventory {
  if (typeof window === "undefined") return EMPTY_INVENTORY;
  try {
    const raw = window.localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (!raw) return EMPTY_INVENTORY;
    const parsed = JSON.parse(raw) as Partial<Inventory>;
    const packs = typeof parsed.packs === "number" && parsed.packs >= 0 ? Math.floor(parsed.packs) : 0;
    const cards: Record<string, number> = {};
    if (parsed.cards && typeof parsed.cards === "object") {
      for (const [id, count] of Object.entries(parsed.cards)) {
        if (typeof count === "number" && count > 0) cards[id] = Math.floor(count);
      }
    }
    return { packs, cards };
  } catch {
    return EMPTY_INVENTORY;
  }
}

export function saveInventory(inventory: Inventory): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
}
