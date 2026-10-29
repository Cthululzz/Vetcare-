import { useState } from "react";
import { Package, Search, Plus, Filter, AlertTriangle } from "lucide-react";
import { Footer } from "../components/common/Footer";
import { useInventory } from "../hooks/useInventory";
import { useInventoryTags } from "../hooks/useInventoryTags";
import { InventoryMovementForm } from "../components/inventory/InventoryMovementForm";
import { InventoryMovementHistory } from "../components/inventory/InventoryMovementHistory";

const Inventory = () => {
  const { searchProducts, getLowStockProducts } = useInventory();
  const { getTags } = useInventoryTags();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const tags = getTags();
  const products = searchProducts(searchQuery, {
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    lowStockOnly,
  });
  const lowStockProducts = getLowStockProducts();

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName],
    );
  };

  const getStockStatus = (current: number, min: number) => {
    if (current === 0) return { label: "Sin stock", color: "text-red-400" };
    if (current <= min) return { label: "Stock bajo", color: "text-amber-400" };
    return { label: "Disponible", color: "text-emerald-400" };
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-2rem)] justify-between w-full px-4 sm:px-6 lg:px-8 mx-auto">
      <div className="space-y-6 pb-6 max-w-7xl w-full mx-auto">
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-[#ece883]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <Package className="w-8 h-8 text-[#ece883]" />
                Inventario y Farmacia
              </h1>
              <p className="text-sm text-slate-400 max-w-xl">
                Gestión completa de medicamentos, insumos y control de stock
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowHistory(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors"
              >
                <Filter className="w-4 h-4" />
                Historial
              </button>
              <button
                onClick={() => setShowMovementForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ece883] hover:bg-[#e4df68] text-slate-950 text-sm font-bold transition-colors shadow-md shadow-[#ece883]/10"
              >
                <Plus className="w-4 h-4" />
                Registrar Movimiento
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">
                Total Productos
              </p>
              <h3 className="text-xl font-bold text-white">
                {products.length}
              </h3>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Stock Bajo</p>
              <h3 className="text-xl font-bold text-white">
                {lowStockProducts.length}
              </h3>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Filter className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Tags Activos</p>
              <h3 className="text-xl font-bold text-white">{tags.length}</h3>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, descripción o lote..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
            />
          </div>

          {/* Tags Filter */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Filtrar por Tags
            </p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
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
          </div>

          {/* Low Stock Filter */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-[#ece883] focus:ring-[#ece883]"
              />
              <span className="text-sm font-semibold text-slate-300">
                Mostrar solo productos con stock bajo
              </span>
            </label>
          </div>
        </div>

        {/* Products Grid */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#ece883]">
              Productos en Inventario
            </h3>
            <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
              {products.length}{" "}
              {products.length === 1 ? "producto" : "productos"}
            </span>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-3 stroke-1" />
              <p className="text-sm text-slate-400">
                No hay productos que coincidan con los filtros
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => {
                const stockStatus = getStockStatus(
                  product.currentStock,
                  product.minStock,
                );
                return (
                  <div
                    key={product.id}
                    className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h4 className="text-base font-bold text-white">
                          {product.name}
                        </h4>
                        <span
                          className={`text-xs font-semibold ${stockStatus.color}`}
                        >
                          {stockStatus.label}
                        </span>
                      </div>

                      {product.description && (
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {product.description}
                        </p>
                      )}

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Stock actual:</span>
                          <span className="font-bold text-white">
                            {product.currentStock} {product.unit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Stock mínimo:</span>
                          <span className="font-medium text-slate-300">
                            {product.minStock} {product.unit}
                          </span>
                        </div>
                      </div>

                      {product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/60">
                          {product.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 capitalize"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {product.batch && (
                        <p className="text-[10px] text-slate-500">
                          Lote: {product.batch}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />

      {/* Modals */}
      <InventoryMovementForm
        isOpen={showMovementForm}
        onClose={() => setShowMovementForm(false)}
      />

      <InventoryMovementHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
};

export default Inventory;
