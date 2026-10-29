import { useLocalStorage } from "./useLocalStorage";
import type { InventoryItem } from "../types/inventory";

const INVENTORY_KEY = "vet_inventory";

function generateId(): string {
  return crypto.randomUUID();
}

function isoNow(): string {
  return new Date().toISOString();
}

export function useInventory() {
  const [items, setItems] = useLocalStorage<InventoryItem[]>(INVENTORY_KEY, []);

  const getProducts = (): InventoryItem[] => items.filter((i) => i.isActive);

  const getProduct = (id: string): InventoryItem | undefined =>
    items.find((i) => i.id === id);

  const createProduct = (
    data: Omit<InventoryItem, "id" | "createdAt" | "updatedAt" | "isActive">,
  ): InventoryItem => {
    const newItem: InventoryItem = {
      ...data,
      id: generateId(),
      createdAt: isoNow(),
      updatedAt: isoNow(),
      isActive: true,
    };
    setItems((prev) => [...prev, newItem]);
    return newItem;
  };

  const updateProduct = (
    id: string,
    updates: Partial<Omit<InventoryItem, "id" | "createdAt">>,
  ) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, ...updates, updatedAt: isoNow() } : i,
      ),
    );
  };

  const deleteProduct = (id: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, isActive: false, updatedAt: isoNow() } : i,
      ),
    );
  };

  const getLowStockProducts = (): InventoryItem[] =>
    items.filter((i) => i.isActive && i.currentStock <= i.minStock);

  const searchProducts = (
    query: string,
    filters?: {
      tags?: string[];
      category?: string;
      lowStockOnly?: boolean;
    },
  ): InventoryItem[] => {
    let result = items.filter((i) => i.isActive);

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.batch?.toLowerCase().includes(q),
      );
    }

    if (filters?.tags && filters.tags.length > 0) {
      result = result.filter((i) =>
        filters.tags!.some((tag) => i.tags.includes(tag)),
      );
    }

    if (filters?.category) {
      result = result.filter((i) => i.category === filters.category);
    }

    if (filters?.lowStockOnly) {
      result = result.filter((i) => i.currentStock <= i.minStock);
    }

    return result;
  };

  return {
    items,
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getLowStockProducts,
    searchProducts,
  };
}
