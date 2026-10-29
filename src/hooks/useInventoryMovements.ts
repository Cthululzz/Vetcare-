import { useLocalStorage } from "./useLocalStorage";
import type { InventoryMovement, MovementType } from "../types/inventory";
import { useInventory } from "./useInventory";

const MOVEMENTS_KEY = "vet_inventory_movements";

function generateId(): string {
  return crypto.randomUUID();
}

function isoNow(): string {
  return new Date().toISOString();
}

export function useInventoryMovements() {
  const [movements, setMovements] = useLocalStorage<InventoryMovement[]>(
    MOVEMENTS_KEY,
    [],
  );
  const { getProduct, updateProduct } = useInventory();

  const getMovements = (filters?: {
    productId?: string;
    type?: MovementType;
    userName?: string;
    startDate?: string;
    endDate?: string;
    pendingOnly?: boolean;
  }): InventoryMovement[] => {
    let result = [...movements];

    if (filters?.productId) {
      result = result.filter((m) => m.productId === filters.productId);
    }

    if (filters?.type) {
      result = result.filter((m) => m.type === filters.type);
    }

    if (filters?.userName) {
      result = result.filter((m) =>
        m.userName?.toLowerCase().includes(filters.userName!.toLowerCase()),
      );
    }

    if (filters?.startDate) {
      result = result.filter((m) => m.date >= filters.startDate!);
    }

    if (filters?.endDate) {
      result = result.filter((m) => m.date <= filters.endDate!);
    }

    if (filters?.pendingOnly) {
      result = result.filter((m) => !m.isComplete);
    }

    return result.sort((a, b) => b.date.localeCompare(a.date));
  };

  const createMovement = (data: {
    productId: string;
    type: MovementType;
    quantity: number;
    reason?: string;
    userName?: string;
    userRole?: string;
    patientName?: string;
    isComplete?: boolean;
  }): InventoryMovement => {
    const newMovement: InventoryMovement = {
      ...data,
      id: generateId(),
      date: isoNow(),
      isComplete: data.isComplete ?? true,
      pendingSince: data.isComplete === false ? isoNow() : undefined,
      createdAt: isoNow(),
    };

    setMovements((prev) => [newMovement, ...prev]);

    // Actualizar stock del producto
    const product = getProduct(data.productId);
    if (product) {
      let newStock = product.currentStock;
      if (data.type === "ingreso" || data.type === "devolucion") {
        newStock += data.quantity;
      } else if (data.type === "retiro" || data.type === "vencimiento") {
        newStock = Math.max(0, newStock - data.quantity);
      } else if (data.type === "ajuste") {
        newStock = data.quantity;
      }
      updateProduct(data.productId, { currentStock: newStock });
    }

    return newMovement;
  };

  const completeMovement = (
    id: string,
    data: {
      userName: string;
      userRole: string;
      reason?: string;
      patientName?: string;
    },
  ) => {
    setMovements((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              ...data,
              isComplete: true,
              pendingSince: undefined,
            }
          : m,
      ),
    );
  };

  const getPendingMovements = (): InventoryMovement[] =>
    movements.filter((m) => !m.isComplete);

  return {
    movements,
    getMovements,
    createMovement,
    completeMovement,
    getPendingMovements,
  };
}
