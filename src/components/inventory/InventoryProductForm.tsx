import { useState } from "react";
import { Package, Save, X } from "lucide-react";
import { useInventory } from "../../hooks/useInventory";
import { useInventoryTags } from "../../hooks/useInventoryTags";
import {
  CATEGORIAS_INVENTARIO,
  UNIDADES_INVENTARIO,
} from "../../constants/inventory";
import type { InventoryItem } from "../../types/inventory";

interface InventoryProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (product: InventoryItem) => void;
}

const toNumber = (value: string): number => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const InventoryProductForm = ({
  isOpen,
  onClose,
  onCreated,
}: InventoryProductFormProps) => {
  const { createProduct, getProducts } = useInventory();
  const { getTags, createTag } = useInventoryTags();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("medicamento");
  const [unit, setUnit] = useState<string>("ml");
  const [currentStock, setCurrentStock] = useState("");
  const [minStock, setMinStock] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [batch, setBatch] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const tags = getTags();

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("medicamento");
    setUnit("ml");
    setCurrentStock("");
    setMinStock("");
    setSelectedTags([]);
    setNewTag("");
    setBatch("");
    setExpirationDate("");
    setLocation("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((tag) => tag !== tagName)
        : [...prev, tagName],
    );
  };

  const handleAddTag = () => {
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

    const cleanName = name.trim();
    if (!cleanName) {
      setError("El nombre del producto es obligatorio.");
      return;
    }

    const duplicated = getProducts().some(
      (product) => product.name.trim().toLowerCase() === cleanName.toLowerCase(),
    );
    if (duplicated) {
      setError("Ya existe un producto con ese nombre en el inventario.");
      return;
    }

    const parsedStock = toNumber(currentStock);
    const parsedMinStock = toNumber(minStock);

    if (parsedStock < 0 || parsedMinStock < 0) {
      setError("Las cantidades de stock no pueden ser negativas.");
      return;
    }

    const created = createProduct({
      name: cleanName,
      description: description.trim() || undefined,
      category,
      tags: selectedTags,
      unit,
      currentStock: parsedStock,
      minStock: parsedMinStock,
      batch: batch.trim() || undefined,
      expirationDate: expirationDate || undefined,
      location: location.trim() || undefined,
    });

    onCreated?.(created);
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#ece883]/10 text-[#ece883] border border-[#ece883]/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Nuevo Producto</h2>
              <p className="text-sm text-slate-400 mt-0.5">
                Registra el producto con su unidad de medida real
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          id="inventory-product-form"
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
              placeholder="Ej. Amoxicilina 250 mg"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
              placeholder="Presentación, concentración u observaciones..."
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
                Unidad de medida (pesaje) *
              </label>
              <select
                value={unit}
                onChange={(event) => setUnit(event.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ece883] transition-colors"
              >
                {UNIDADES_INVENTARIO.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-[#ece883]/20 bg-[#ece883]/5 px-4 py-3">
            <p className="text-[11px] text-slate-300">
              El stock se controla y descuenta en esta unidad. Por ejemplo, un
              frasco de 100 ml se registra en <span className="text-[#ece883]">ml</span> y
              una caja de 20 comprimidos en{" "}
              <span className="text-[#ece883]">comprimidos</span>. Asumimos que el
              envase se abre y se consume hasta agotarse.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Stock inicial ({unit}) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={currentStock}
                onChange={(event) => {
                  setCurrentStock(event.target.value);
                  setError("");
                }}
                placeholder="Ej. 100"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Stock mínimo ({unit})
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
                placeholder="Ej. 10"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
              />
            </div>
          </div>

          {/* Tags */}
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
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
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
                placeholder="Ej. L-2026-04"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Vencimiento
              </label>
              <input
                type="date"
                value={expirationDate}
                onChange={(event) => setExpirationDate(event.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ece883] transition-colors"
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
                placeholder="Ej. Refrigerador"
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

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="inventory-product-form"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ece883] hover:bg-[#e4df68] text-slate-950 text-sm font-bold transition-colors shadow-lg shadow-[#ece883]/10 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Guardar Producto
          </button>
        </div>
      </div>
    </div>
  );
};
