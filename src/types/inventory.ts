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
  /** Unidad de control con la que se mide y descuenta el stock (g, ml, comprimido). */
  unit: string;

  // Presentación del producto (opcional)
  /** Tipo de envase en que llega: sachet, caja, frasco, saco, etc. */
  packageType?: string;
  /** Contenido de cada envase, expresado en contentUnit. */
  contentPerPackage?: number;
  /** Unidad en que se expresa el contenido del envase (kg, ml, comprimido). */
  contentUnit?: string;

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
  | "devolucion"
  | "merma";

export interface InventoryMovement {
  id: string;
  productId: string;
  type: MovementType;
  /** Cantidad del movimiento, siempre en la unidad de control del producto. */
  quantity: number;

  // Información del movimiento
  date: string;
  reason?: string;
  /** Unidad de control del producto al momento del movimiento. */
  unit?: string;

  // Presentación usada al ingresar stock
  packageQuantity?: number;
  packageType?: string;
  packageContent?: number;
  packageContentUnit?: string;

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
