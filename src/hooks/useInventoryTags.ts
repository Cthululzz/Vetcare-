import { useLocalStorage } from "./useLocalStorage";
import type { InventoryTag } from "../types/inventory";

const TAGS_KEY = "vet_inventory_tags";

function generateId(): string {
  return crypto.randomUUID();
}

function isoNow(): string {
  return new Date().toISOString();
}

// Tags iniciales del sistema
const SYSTEM_TAGS: Omit<InventoryTag, "id" | "createdAt">[] = [
  { name: "antibioticos", isSystem: true },
  { name: "antiparasitarios", isSystem: true },
  { name: "analgesicos", isSystem: true },
  { name: "anestesicos", isSystem: true },
  { name: "vitaminas", isSystem: true },
  { name: "antiinflamatorios", isSystem: true },
  { name: "vacunas", isSystem: true },
  { name: "suplementos", isSystem: true },
];

export function useInventoryTags() {
  const [tags, setTags] = useLocalStorage<InventoryTag[]>(
    TAGS_KEY,
    SYSTEM_TAGS.map((t) => ({
      ...t,
      id: generateId(),
      createdAt: isoNow(),
    })),
  );

  const getTags = (): InventoryTag[] => tags;

  const getSystemTags = (): InventoryTag[] => tags.filter((t) => t.isSystem);

  const getCustomTags = (): InventoryTag[] => tags.filter((t) => !t.isSystem);

  const createTag = (name: string): InventoryTag => {
    const normalized = name.toLowerCase().trim();
    const existing = tags.find((t) => t.name === normalized);
    if (existing) return existing;

    const newTag: InventoryTag = {
      id: generateId(),
      name: normalized,
      isSystem: false,
      createdAt: isoNow(),
    };
    setTags((prev) => [...prev, newTag]);
    return newTag;
  };

  const deleteTag = (id: string) => {
    setTags((prev) => prev.filter((t) => t.id !== id || t.isSystem));
  };

  const getTagNames = (): string[] => tags.map((t) => t.name);

  return {
    tags,
    getTags,
    getSystemTags,
    getCustomTags,
    createTag,
    deleteTag,
    getTagNames,
  };
}
