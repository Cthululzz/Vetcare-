// ============================================
// TIPOS DE INVENTARIO Y FARMACIA
// ============================================

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  tags: string[];

  // Stock
  currentStock: number;
  minStock: number;
  unit: string;

  // Control
  batch?: string;
  expirationDate?: string;
  location?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export type MovementType =
  | "ingreso"
  | "retiro"
  | "ajuste"
  | "vencimiento"
  | "devolucion";

export interface InventoryMovement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;

  // Información del movimiento
  date: string;
  reason?: string;

  // Para retiros
  userName?: string;
  userRole?: string;
  patientName?: string;

  // Estado del retiro
  isComplete: boolean;
  pendingSince?: string;

  // Metadata
  createdAt: string;
}

export interface InventoryTag {
  id: string;
  name: string;
  isSystem: boolean;
  createdAt: string;
}

export interface PendingInventoryReminder {
  id: string;
  movementId: string;
  userId: string;
  createdAt: string;
  lastNotifiedAt?: string;
}
