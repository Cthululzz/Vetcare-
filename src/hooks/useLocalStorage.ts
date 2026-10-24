import { useCallback, useSyncExternalStore } from "react";

// ============================================
// STORE CENTRALIZADO (singleton a nivel de módulo)
// ============================================
// Un único cache en memoria compartido por TODOS los componentes.
// Esto elimina los estados divergentes y los loops de sincronización.

type Listener = () => void;

const cache = new Map<string, unknown>();
const listeners = new Map<string, Set<Listener>>();

function readFromStorage<T>(key: string, initialValue: T): T {
  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : initialValue;
  } catch (error) {
    console.error(`Error leyendo localStorage key "${key}":`, error);
    return initialValue;
  }
}

function notify(key: string): void {
  const subs = listeners.get(key);
  if (subs) {
    subs.forEach((listener) => listener());
  }
}

export const storageStore = {
  /**
   * Obtiene el valor del cache (lo lee de localStorage la primera vez).
   * Devuelve la MISMA referencia mientras no haya cambios (requerido por useSyncExternalStore).
   */
  get<T>(key: string, initialValue: T): T {
    if (!cache.has(key)) {
      cache.set(key, readFromStorage(key, initialValue));
    }
    return cache.get(key) as T;
  },

  /**
   * Escribe en el cache + localStorage y notifica a todos los suscriptores.
   */
  set<T>(key: string, value: T): void {
    cache.set(key, value);
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error guardando en localStorage key "${key}":`, error);
    }
    notify(key);
  },

  /**
   * Suscribe un listener a los cambios de una key. Devuelve función para desuscribir.
   */
  subscribe(key: string, listener: Listener): () => void {
    if (!listeners.has(key)) {
      listeners.set(key, new Set());
    }
    listeners.get(key)!.add(listener);
    return () => {
      listeners.get(key)?.delete(listener);
    };
  },
};

// ============================================
// SINCRONIZACIÓN ENTRE PESTAÑAS (evento storage nativo)
// ============================================
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event: StorageEvent) => {
    if (event.key === null) return;

    if (event.newValue !== null) {
      try {
        const newValue = JSON.parse(event.newValue);
        cache.set(event.key, newValue);
        notify(event.key);
      } catch (error) {
        console.error(
          `Error sincronizando localStorage key "${event.key}":`,
          error,
        );
      }
    } else {
      // La key fue eliminada en otra pestaña
      cache.delete(event.key);
      notify(event.key);
    }
  });
}

// ============================================
// HOOK PRINCIPAL
// ============================================
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Suscribirse al store: React re-renderiza cuando notify(key) se llama
  const subscribe = useCallback(
    (onStoreChange: () => void) => storageStore.subscribe(key, onStoreChange),
    [key],
  );

  // Devolver el snapshot actual (misma referencia si no cambió)
  const getSnapshot = useCallback(
    () => storageStore.get(key, initialValue),
    [key, initialValue],
  );

  const value = useSyncExternalStore(subscribe, getSnapshot);

  // Setter que escribe en el store central
  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = storageStore.get(key, initialValue);
      const nextValue = next instanceof Function ? next(prev) : next;
      storageStore.set(key, nextValue);
    },
    [key, initialValue],
  );

  return [value, setValue] as const;
}
