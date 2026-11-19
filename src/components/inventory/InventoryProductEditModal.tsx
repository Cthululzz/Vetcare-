import { useState } from "react";
import { Package, Save, Trash2, X } from "lucide-react";
import { DateInput } from "../common/DateInput";
import { useInventory } from "../../hooks/useInventory";
import { useInventoryTags } from "../../hooks/useInventoryTags";
import { useLicense } from "../../hooks/useLicense";
import { CATEGORIAS_INVENTARIO } from "../../constants/inventory";
import type { InventoryItem } from "../../types/inventory";

interface InventoryProductEditModalProps {
  isOpen: boolean;
  product: InventoryItem | null;
  onClose: () => void;
  onSaved?: (product: InventoryItem) => void;
  onDeleted?: (product: InventoryItem) => void;
}

const toNumber = (value: string): number => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Edición de los datos de un producto ya creado.
 * El stock no se edita aquí: se ajusta con movimientos para no perder trazabilidad.
 */
export const InventoryProductEditModal = ({
  isOpen,
  product,
  onClose,
  onSaved,
  onDeleted,
}: InventoryProductEditModalProps) => {
  const { updateProduct, deleteProduct, getProducts } = useInventory();
  const { getTags, createTag } = useInventoryTags();
  const { isReadOnly } = useLicense();

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [category, setCategory] = useState(product?.category ?? "medicamento");
  const [minStock, setMinStock] = useState(
    product ? String(product.minStock) : "",
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    product?.tags ?? [],
  );
  const [newTag, setNewTag] = useState("");
  const [batch, setBatch] = useState(product?.batch ?? "");
  const [expirationDate, setExpirationDate] = useState(
    product?.expirationDate ?? "",
  );
  const [location, setLocation] = useState(product?.location ?? "");
  const [error, setError] = useState("");

  if (!isOpen || !product) return null;

  const tags = getTags();

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((tag) => tag !== tagName)
        : [...prev, tagName],
    );
  };

  const handleAddTag = () => {
    if (isReadOnly) return;
    const cleanTag = newTag.trim();
    if (!cleanTag) return;

    const created = createTag(cleanTag);
    setSelectedTags((prev) =>
      prev.includes(created.name) ? prev : [...prev, created.name],
    );
    setNewTag("");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isReadOnly) return;

    const cleanName = name.trim();
    if (!cleanName) {
      setError("El nombre del producto es obligatorio.");
      return;
    }

    const duplicated = getProducts().some(
      (item) =>
        item.id !== product.id &&
        item.name.trim().toLowerCase() === cleanName.toLowerCase(),
    );
    if (duplicated) {
      setError("Ya existe otro producto con ese nombre en el inventario.");
      return;
    }

    const parsedMinStock = toNumber(minStock);
    if (parsedMinStock < 0) {
      setError("El stock mínimo no puede ser negativo.");
      return;
    }

    updateProduct(product.id, {
      name: cleanName,
      description: description.trim() || undefined,
      category,
      tags: selectedTags,
      minStock: parsedMinStock,
      batch: batch.trim() || undefined,
      expirationDate: expirationDate || undefined,
      location: location.trim() || undefined,
    });

    onSaved?.({
      ...product,
      name: cleanName,
      description: description.trim() || undefined,
      category,
      tags: selectedTags,
      minStock: parsedMinStock,
      batch: batch.trim() || undefined,
      expirationDate: expirationDate || undefined,
      location: location.trim() || undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    if (isReadOnly) return;
    const confirmed = window.confirm(
      `¿Dar de baja "${product.name}" del inventario? El historial de movimientos se conserva.`,
    );
    if (!confirmed) return;

    deleteProduct(product.id);
    onDeleted?.(product);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#ece883]/10 text-[#ece883] border border-[#ece883]/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Editar Producto</h2>
              <p className="text-sm text-slate-400 mt-0.5">
                Actualiza los datos del producto sin alterar su stock.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-5"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Nombre del producto *
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Descripción (opcional)
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Categoría *
              </label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ece883] transition-colors"
              >
                {CATEGORIAS_INVENTARIO.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Stock mínimo ({product.unit})
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={minStock}
                onChange={(event) => {
                  setMinStock(event.target.value);
                  setError("");
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
              Tags
            </p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${
                    selectedTags.includes(tag.name)
                      ? "bg-[#ece883] text-slate-950"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={newTag}
                onChange={(event) => setNewTag(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Agregar tag nuevo..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={isReadOnly}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                Agregar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Lote
              </label>
              <input
                type="text"
                value={batch}
                onChange={(event) => setBatch(event.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Vencimiento
              </label>
              <DateInput
                value={expirationDate}
                onChange={setExpirationDate}
                placeholder="dd/mm/aaaa"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Ubicación
              </label>
              <input
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-xs">
              {error}
            </div>
          )}
        </form>

        <div className="flex items-center justify-between gap-3 p-6 border-t border-slate-800">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isReadOnly}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Dar de baja
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isReadOnly}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ece883] hover:bg-[#e4df68] text-slate-950 text-sm font-bold transition-colors shadow-lg shadow-[#ece883]/10 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
