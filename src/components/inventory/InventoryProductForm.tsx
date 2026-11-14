import { useState } from "react";
import { Package, Save, X } from "lucide-react";
import { useInventory } from "../../hooks/useInventory";
import { useInventoryTags } from "../../hooks/useInventoryTags";
import {
  CATEGORIAS_INVENTARIO,
  TIPOS_PRESENTACION,
  UNIDADES_INVENTARIO,
} from "../../constants/inventory";
import type { InventoryItem } from "../../types/inventory";
import {
  convertUnit,
  formatPackagePlural,
  formatQuantity,
  formatQuantityInPackages,
  formatQuantityWithUnit,
  getContentUnitOptions,
} from "../../utils/inventoryUnits";

interface InventoryProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (product: InventoryItem) => void;
}

type StockMode = "packages" | "base";

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

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("medicamento");
  const [unit, setUnit] = useState<string>("ml");
  const [packageType, setPackageType] = useState("");
  const [contentPerPackage, setContentPerPackage] = useState("");
  const [contentUnit, setContentUnit] = useState<string>("ml");
  const [stockMode, setStockMode] = useState<StockMode>("packages");
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
  const contentUnitOptions = getContentUnitOptions(unit);

  const parsedContent = toNumber(contentPerPackage);
  const contentInBaseUnit =
    convertUnit(parsedContent, contentUnit, unit) ?? null;
  const presentationReady = Boolean(
    packageType.trim() && contentInBaseUnit && contentInBaseUnit > 0,
  );
  const effectiveStockMode: StockMode = presentationReady
    ? stockMode
    : "base";

  const packageLabel = formatPackagePlural(packageType.trim() || "envase", 0);
  const stockLabel =
    effectiveStockMode === "packages" ? packageLabel : unit;

  const initialStockValue = toNumber(currentStock);
  const minStockValue = toNumber(minStock);
  const initialStockBase =
    effectiveStockMode === "packages" && contentInBaseUnit
      ? initialStockValue * contentInBaseUnit
      : initialStockValue;
  const minStockBase =
    effectiveStockMode === "packages" && contentInBaseUnit
      ? minStockValue * contentInBaseUnit
      : minStockValue;

  const presentationItem = {
    unit,
    packageType: packageType.trim(),
    contentPerPackage: parsedContent,
    contentUnit,
  };
  const initialPackagesLabel = presentationReady
    ? formatQuantityInPackages(initialStockBase, presentationItem)
    : null;
  const minPackagesLabel = presentationReady
    ? formatQuantityInPackages(minStockBase, presentationItem)
    : null;

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("medicamento");
    setUnit("ml");
    setPackageType("");
    setContentPerPackage("");
    setContentUnit("ml");
    setStockMode("packages");
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

  const handleUnitChange = (nextUnit: string) => {
    setUnit(nextUnit);
    setContentUnit(nextUnit);
    setError("");
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

    const hasAnyPresentationValue =
      packageType.trim() || contentPerPackage.trim() || contentUnit !== unit;

    if (hasAnyPresentationValue) {
      if (!packageType.trim()) {
        setError("Indica el tipo de envase o deja la presentación vacía.");
        return;
      }
      if (!contentPerPackage || parsedContent <= 0) {
        setError("El contenido por envase debe ser mayor a cero.");
        return;
      }
      if (!contentInBaseUnit || contentInBaseUnit <= 0) {
        setError(
          `La unidad del contenido no es compatible con la unidad de control (${unit}).`,
        );
        return;
      }
    }

    if (initialStockValue < 0 || minStockValue < 0) {
      setError("Las cantidades de stock no pueden ser negativas.");
      return;
    }

    if (
      !Number.isFinite(initialStockBase) ||
      !Number.isFinite(minStockBase)
    ) {
      setError("Revisa las cantidades de stock ingresadas.");
      return;
    }

    const created = createProduct({
      name: cleanName,
      description: description.trim() || undefined,
      category,
      tags: selectedTags,
      unit,
      currentStock: roundQuantity(initialStockBase),
      minStock: roundQuantity(minStockBase),
      packageType: presentationReady ? packageType.trim() : undefined,
      contentPerPackage: presentationReady ? parsedContent : undefined,
      contentUnit: presentationReady ? contentUnit : undefined,
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
                Registra el stock total en la unidad que realmente se consume
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
              placeholder="Ej. Royal Canin Gastrointestinal Feline"
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
                Unidad de control *
              </label>
              <select
                value={unit}
                onChange={(event) => handleUnitChange(event.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ece883] transition-colors"
              >
                {UNIDADES_INVENTARIO.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Es la unidad con la que se mide la dosis y se descuenta el
                stock: g, ml, comprimido, etc.
              </p>
            </div>
          </div>

          {/* Presentación */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Presentación del producto (opcional)
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Sirve para ingresar cajas, sachets, frascos o sacos y convertir
                automáticamente al total interno.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tipo de envase
                </label>
                <input
                  type="text"
                  list="tipos-presentacion"
                  value={packageType}
                  onChange={(event) => {
                    setPackageType(event.target.value);
                    setError("");
                  }}
                  placeholder="Ej. sachet, caja, saco"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
                />
                <datalist id="tipos-presentacion">
                  {TIPOS_PRESENTACION.map((type) => (
                    <option key={type} value={type} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Contenido por envase
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={contentPerPackage}
                    onChange={(event) => {
                      setContentPerPackage(event.target.value);
                      setError("");
                    }}
                    placeholder="Ej. 85"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
                  />
                  <select
                    value={contentUnit}
                    onChange={(event) => {
                      setContentUnit(event.target.value);
                      setError("");
                    }}
                    className="w-24 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#ece883] transition-colors"
                  >
                    {contentUnitOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {presentationReady ? (
              <p className="text-[11px] text-[#ece883]">
                1 {packageType.trim()} = {formatQuantity(parsedContent)}{" "}
                {contentUnit} = {formatQuantity(contentInBaseUnit ?? 0)} {unit}
              </p>
            ) : (
              <p className="text-[11px] text-slate-500">
                Sin presentación: el stock se controla directamente en {unit}.
              </p>
            )}
          </div>

          {/* Stock */}
          <div className="space-y-3">
            {presentationReady && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Ingresar stock en:
                </span>
                <button
                  type="button"
                  onClick={() => setStockMode("packages")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${
                    effectiveStockMode === "packages"
                      ? "bg-[#ece883] text-slate-950"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {packageLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setStockMode("base")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    effectiveStockMode === "base"
                      ? "bg-[#ece883] text-slate-950"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {unit}
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Stock inicial ({stockLabel}) *
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
                  placeholder={
                    effectiveStockMode === "packages" ? "Ej. 25" : "Ej. 2.125"
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Stock mínimo ({stockLabel})
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
                  placeholder={
                    effectiveStockMode === "packages" ? "Ej. 3" : "Ej. 250"
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#ece883]/20 bg-[#ece883]/5 px-4 py-3 space-y-1">
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
                <span className={initialPackagesLabel ? "font-semibold text-slate-200" : "font-bold text-[#ece883]"}>
                  {formatQuantityWithUnit(initialStockBase, unit)}
                </span>
              </p>
              <p className="text-xs text-slate-400">
                Stock mínimo equivalente:{" "}
                <span className="font-semibold text-slate-200">
                  {minPackagesLabel ?? formatQuantityWithUnit(minStockBase, unit)}
                </span>
                {minPackagesLabel && (
                  <span className="text-slate-500">
                    {" "}
                    ({formatQuantityWithUnit(minStockBase, unit)})
                  </span>
                )}
              </p>
              <p className="text-[11px] text-slate-500">
                Cada consumo o retiro se descuenta de este total, sin importar
                si se ingresó por envases o por unidad de control.
              </p>
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
