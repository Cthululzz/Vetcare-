import { useState } from "react";
import { Package, Save, X } from "lucide-react";
import { DateInput } from "../common/DateInput";
import { useInventory } from "../../hooks/useInventory";
import { useInventoryTags } from "../../hooks/useInventoryTags";
import { useLicense } from "../../hooks/useLicense";
import {
  CATEGORIAS_INVENTARIO,
  getInternalUnit,
  TIPOS_PRESENTACION,
  UNIDADES_CONTENIDO,
} from "../../constants/inventory";
import type { InventoryItem } from "../../types/inventory";
import {
  convertUnit,
  formatPackagePlural,
  formatQuantity,
  formatQuantityInPackages,
  formatQuantityWithUnit,
  normalizePackageName,
} from "../../utils/inventoryUnits";

interface InventoryProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (product: InventoryItem) => void;
}

const toNumber = (value: string): number => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundQuantity = (value: number): number => Math.round(value * 100) / 100;

export const InventoryProductForm = ({
  isOpen,
  onClose,
  onCreated,
}: InventoryProductFormProps) => {
  const { createProduct, getProducts } = useInventory();
  const { getTags, createTag } = useInventoryTags();
  const { isReadOnly } = useLicense();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("medicamento");
  const [packageType, setPackageType] = useState("");
  const [packageQuantity, setPackageQuantity] = useState("");
  const [contentPerPackage, setContentPerPackage] = useState("");
  const [contentUnit, setContentUnit] = useState<string>("g");
  const [minStock, setMinStock] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [batch, setBatch] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const tags = getTags();

  // La unidad interna se deduce del contenido del envase:
  // kg → g, L → ml; el resto se conserva (g, mg, ml, comprimido...).
  const internalUnit = getInternalUnit(contentUnit);
  const parsedContent = toNumber(contentPerPackage);
  const contentInBase = convertUnit(parsedContent, contentUnit, internalUnit) ?? 0;

  const parsedQuantity = toNumber(packageQuantity);
  const parsedMinStock = toNumber(minStock);
  const initialStockBase = roundQuantity(parsedQuantity * contentInBase);
  const minStockBase = roundQuantity(parsedMinStock * contentInBase);

  const packageName = normalizePackageName(packageType);
  const packageLabel = packageName || "envase";
  const packagePlural = formatPackagePlural(packageLabel, 2);
  const presentationReady = Boolean(
    packageName && parsedContent > 0 && contentInBase > 0,
  );
  const presentationItem = {
    unit: internalUnit,
    packageType: packageName,
    contentPerPackage: parsedContent,
    contentUnit,
  };
  const initialPackagesLabel = presentationReady
    ? formatQuantityInPackages(initialStockBase, presentationItem)
    : null;
  const minPackagesLabel =
    presentationReady && parsedMinStock > 0
      ? formatQuantityInPackages(minStockBase, presentationItem)
      : null;

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("medicamento");
    setPackageType("");
    setPackageQuantity("");
    setContentPerPackage("");
    setContentUnit("g");
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
      (product) => product.name.trim().toLowerCase() === cleanName.toLowerCase(),
    );
    if (duplicated) {
      setError("Ya existe un producto con ese nombre en el inventario.");
      return;
    }

    if (!packageName) {
      setError("Indica el tipo de envase: latas, frascos, cajas, sobres...");
      return;
    }

    if (parsedContent <= 0) {
      setError("El contenido por envase debe ser mayor a cero.");
      return;
    }

    if (contentInBase <= 0) {
      setError(
        `No se pudo convertir el contenido del envase a ${internalUnit}. Revisa la unidad usada.`,
      );
      return;
    }

    if (parsedQuantity < 0 || parsedMinStock < 0) {
      setError("Las cantidades no pueden ser negativas.");
      return;
    }

    const created = createProduct({
      name: cleanName,
      description: description.trim() || undefined,
      category,
      tags: selectedTags,
      unit: internalUnit,
      currentStock: initialStockBase,
      minStock: minStockBase,
      packageType: packageName,
      contentPerPackage: parsedContent,
      contentUnit,
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
                Registra la entrada indicando envases, contenido y stock mínimo
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
              placeholder="Ej. Royal Canin Perro Adulto Húmedo"
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
              placeholder="Ej. Comida húmeda para perro adulto"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors resize-none"
            />
          </div>

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

          {/* Entrada de producto */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Entrada del producto
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Indica cuántos envases ingresaron y cuánto contiene cada uno.
                El sistema calcula y guarda el total interno.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Cantidad que ingresó *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={packageQuantity}
                  onChange={(event) => {
                    setPackageQuantity(event.target.value);
                    setError("");
                  }}
                  placeholder="Ej. 40"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tipo de envase *
                </label>
                <input
                  type="text"
                  list="tipos-presentacion"
                  value={packageType}
                  onChange={(event) => {
                    setPackageType(event.target.value);
                    setError("");
                  }}
                  placeholder="Ej. latas, frascos, cajas"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
                />
                <datalist id="tipos-presentacion">
                  {TIPOS_PRESENTACION.map((type) => (
                    <option key={type} value={type} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Peso o contenido por envase *
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={contentPerPackage}
                  onChange={(event) => {
                    setContentPerPackage(event.target.value);
                    setError("");
                  }}
                  placeholder="Ej. 400"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Unidad del contenido *
                </label>
                <select
                  value={contentUnit}
                  onChange={(event) => {
                    setContentUnit(event.target.value);
                    setError("");
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ece883] transition-colors"
                >
                  {UNIDADES_CONTENIDO.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {presentationReady && (
              <p className="text-[11px] text-[#ece883]">
                Cada {packageLabel} trae {formatQuantity(parsedContent)}{" "}
                {contentUnit} · se guardará internamente en {internalUnit}.
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Stock mínimo ({packagePlural})
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={minStock}
                  onChange={(event) => {
                    setMinStock(event.target.value);
                    setError("");
                  }}
                  placeholder="Ej. 4"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
                />
                {presentationReady && parsedMinStock > 0 && (
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    = {formatQuantityWithUnit(minStockBase, internalUnit)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Resumen calculado */}
          <div className="rounded-xl border border-[#ece883]/20 bg-[#ece883]/5 px-4 py-3 space-y-1">
            <p className="text-xs text-slate-200">
              Entrada:{" "}
              <span className="font-semibold text-slate-100">
                {formatQuantity(parsedQuantity)} {packagePlural}
                {presentationReady
                  ? ` × ${formatQuantity(parsedContent)} ${contentUnit}`
                  : ""}
              </span>
            </p>
            {initialPackagesLabel && (
              <p className="text-xs text-slate-200">
                Se registrarán:{" "}
                <span className="font-bold text-[#ece883]">
                  {initialPackagesLabel}
                </span>
              </p>
            )}
            <p className="text-xs text-slate-200">
              Total interno guardado:{" "}
              <span className="font-bold text-[#ece883]">
                {formatQuantityWithUnit(initialStockBase, internalUnit)}
              </span>
            </p>
            <p className="text-xs text-slate-400">
              Stock mínimo:{" "}
              <span className="font-semibold text-slate-200">
                {minPackagesLabel
                  ? `${minPackagesLabel} (${formatQuantityWithUnit(minStockBase, internalUnit)})`
                  : formatQuantityWithUnit(minStockBase, internalUnit)}
              </span>
            </p>
            <p className="text-[11px] text-slate-500">
              Cada consumo o retiro descuenta del total interno. El stock se
              mostrará como envases completos + cantidad suelta.
            </p>
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
                placeholder="Ej. L-2026-04"
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
            disabled={isReadOnly}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ece883] hover:bg-[#e4df68] text-slate-950 text-sm font-bold transition-colors shadow-lg shadow-[#ece883]/10 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Guardar Producto
          </button>
        </div>
      </div>
    </div>
  );
};
