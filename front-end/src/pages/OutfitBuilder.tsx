import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import {
  ArrowLeft,
  Save,
  X,
  Image as ImageIcon,
  Search,
} from "lucide-react";
import { getItems } from "../api/endpoints/items/items";
import { getOutfits } from "../api/endpoints/outfits/outfits";

const { itemsControllerFindAll, itemsControllerFindAllAttributes } = getItems();
const { outfitsControllerCreate } = getOutfits();

const SEASONS = ["All", "Spring", "Summer", "Autumn", "Winter"] as const;

// ─── Category ordering for the canvas zones ──────────────────────────────────
// Map each category name (lowercase) to its zone priority
const ZONE_ORDER: Record<string, number> = {
  // Zone 1 – Headwear
  hat: 0, cap: 0, headwear: 0, beanie: 0,
  // Zone 2 – Tops / Outerwear
  top: 1, shirt: 1, tshirt: 1, "t-shirt": 1, blouse: 1, jacket: 1,
  coat: 1, hoodie: 1, sweater: 1, "outer wear": 1, outerwear: 1,
  // Zone 3 – Bottoms
  bottom: 2, pants: 2, skirt: 2, shorts: 2, jeans: 2, trouser: 2, trousers: 2,
  // Zone 4 – Shoes / Accessories at the bottom
  shoes: 3, shoe: 3, sneakers: 3, boots: 3, sandals: 3, accessories: 3,
};

const ZONE_LABELS: Record<number, string> = {
  0: "🎩 Headwear",
  1: "👕 Top",
  2: "👖 Bottom",
  3: "👟 Shoes & Accessories",
};

const getZone = (categoryName?: string): number => {
  if (!categoryName) return 5;
  const key = categoryName.toLowerCase().trim();
  return ZONE_ORDER[key] ?? 5;
};

// ─── Types ───────────────────────────────────────────────────────────────────
type ItemData = {
  _id: string;
  name: string;
  images?: string[];
  category?: { _id: string; name: string } | string;
};

type CanvasItem = ItemData & { canvasId: string };

// ─── Helper ──────────────────────────────────────────────────────────────────
const getCategoryName = (item: ItemData): string | undefined =>
  typeof item.category === "object" ? item.category?.name : item.category;

const getItemImage = (item: ItemData) =>
  item.images && item.images.length > 0 ? item.images[0] : null;

// ─── Draggable source card ───────────────────────────────────────────────────
const DraggableItem = ({ item }: { item: ItemData }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `source-${item._id}`,
    data: { item },
  });

  const imgSrc = getItemImage(item);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100
        shadow-sm cursor-grab active:cursor-grabbing transition-all
        hover:shadow-md hover:-translate-y-0.5 select-none touch-none
        ${isDragging ? "opacity-40 scale-95" : ""}`}
    >
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
        {imgSrc ? (
          <img src={imgSrc} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-5 h-5 text-gray-300" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
        <p className="text-xs text-gray-400 truncate">
          {getCategoryName(item) || "Uncategorized"}
        </p>
      </div>
    </div>
  );
};

// ─── Ghost card on drag overlay ──────────────────────────────────────────────
const GhostCard = ({ item }: { item: ItemData }) => {
  const imgSrc = getItemImage(item);
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border-2 border-primary-300
      shadow-2xl w-60 opacity-95 rotate-2 pointer-events-none ring-2 ring-primary-200">
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
        {imgSrc ? (
          <img src={imgSrc} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-5 h-5 text-gray-300" />
        )}
      </div>
      <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
    </div>
  );
};

// ─── Single item card inside the canvas ──────────────────────────────────────
const CanvasCard = ({
  item,
  onRemove,
}: {
  item: CanvasItem;
  onRemove: (id: string) => void;
}) => {
  const imgSrc = getItemImage(item);
  return (
    <div className="relative group flex items-center gap-3 p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
        {imgSrc ? (
          <img src={imgSrc} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-6 h-6 text-gray-300" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
        <p className="text-xs text-gray-400">{getCategoryName(item) || "—"}</p>
      </div>
      <button
        type="button"
        onClick={() => onRemove(item.canvasId)}
        className="ml-auto flex-shrink-0 w-7 h-7 bg-red-500 hover:bg-red-600 text-white
          rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100
          focus:opacity-100 transition-all duration-150 shadow-md"
        aria-label="Remove item"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

// ─── Categorized droppable canvas ────────────────────────────────────────────
const CanvasDropZone = ({
  items,
  onRemove,
}: {
  items: CanvasItem[];
  onRemove: (id: string) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas" });

  // Group items by zone then sort within each zone maintain arrival order
  const grouped = items.reduce<Record<number, CanvasItem[]>>((acc, item) => {
    const zone = getZone(getCategoryName(item));
    if (!acc[zone]) acc[zone] = [];
    acc[zone].push(item);
    return acc;
  }, {});

  const sortedZones = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  const isEmpty = items.length === 0;

  return (
    <div
      ref={setNodeRef}
      className={`min-h-64 rounded-2xl border-2 transition-all duration-200 p-4
        ${isOver
          ? "border-primary-400 bg-primary-50/60 shadow-inner"
          : isEmpty
          ? "border-dashed border-gray-300 bg-gray-50/80"
          : "border-solid border-gray-200 bg-gray-50/40"
        }`}
    >
      {isEmpty ? (
        <div className="h-full flex flex-col items-center justify-center py-14 text-gray-400">
          <div className="w-16 h-16 rounded-2xl bg-white border-2 border-dashed border-gray-200 flex items-center justify-center mb-4 shadow-sm">
            <ImageIcon className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-sm font-medium">Drop items here to build your outfit</p>
          <p className="text-xs mt-1 text-gray-400">Items will be sorted by category automatically</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedZones.map((zone) => (
            <div key={zone}>
              {/* Zone label */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {ZONE_LABELS[zone] ?? "Other"}
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div className="space-y-2">
                {grouped[zone].map((item) => (
                  <CanvasCard key={item.canvasId} item={item} onRemove={onRemove} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main page ───────────────────────────────────────────────────────────────
export const OutfitBuilder = () => {
  const navigate = useNavigate();
  const tagInputRef = useRef<HTMLInputElement>(null);

  const [allItems, setAllItems] = useState<ItemData[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);

  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [activeItem, setActiveItem] = useState<ItemData | null>(null);

  const [outfitName, setOutfitName] = useState("");
  const [outfitDescription, setOutfitDescription] = useState("");
  const [season, setSeason] = useState<(typeof SEASONS)[number]>("All");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    itemsControllerFindAll().then((res: unknown) => {
      if (res) setAllItems(res as ItemData[]);
    });
    itemsControllerFindAllAttributes().then((res: unknown) => {
      const data = res as { Category?: { _id: string; name: string }[] };
      if (data?.Category) setCategories(data.Category);
    });
  }, []);

  // ── Filtered source list
  const filteredItems = allItems.filter((item) => {
    const catId = typeof item.category === "object" ? item.category?._id : "";
    const matchesCat = !categoryFilter || catId === categoryFilter;
    const matchesSearch =
      !searchFilter || item.name.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // ── Sensors: MouseSensor + TouchSensor for desktop & mobile
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const item = event.active.data.current?.item as ItemData | undefined;
    setActiveItem(item ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    if (event.over?.id === "canvas" && event.active.data.current?.item) {
      const item = event.active.data.current.item as ItemData;
      setCanvasItems((prev) => [
        ...prev,
        { ...item, canvasId: `${item._id}-${Date.now()}` },
      ]);
    }
  };

  const removeFromCanvas = (canvasId: string) =>
    setCanvasItems((prev) => prev.filter((i) => i.canvasId !== canvasId));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
    tagInputRef.current?.focus();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outfitName.trim() || canvasItems.length === 0) {
      alert("Please give your outfit a name and add at least one item.");
      return;
    }
    setSaving(true);
    try {
      const uniqueIds = [...new Set(canvasItems.map((i) => i._id))];
      await outfitsControllerCreate({
        name: outfitName.trim(),
        description: outfitDescription.trim() || undefined,
        items: uniqueIds,
        season: season as "All" | "Spring" | "Summer" | "Autumn" | "Winter",
        tags,
      });
      navigate("/outfits");
    } catch (err) {
      console.error("Failed to save outfit", err);
      alert("Failed to save outfit. See console for details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="max-w-7xl mx-auto pb-12">
        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex items-center mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mr-4 p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Outfit Builder
            </h2>
            <p className="text-gray-500 mt-0.5 text-sm sm:text-base">
              Drag items from your wardrobe onto the canvas to build an outfit.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave}>
          {/* ── Responsive 2-col (col-reverse on mobile so canvas comes first) ── */}
          <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 gap-6 lg:gap-8">

            {/* ── Left: item source list ─────────────── (stacks below on mobile) */}
            <div className="lg:col-span-4">
              <div className="bg-surface p-4 sm:p-5 rounded-2xl shadow-soft border border-gray-100 lg:sticky lg:top-4">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Your Wardrobe</h3>

                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search items…"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200
                      focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Category filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200
                    focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white mb-4"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* Scrollable item list */}
                <div className="space-y-2 max-h-64 sm:max-h-80 lg:max-h-[60vh] overflow-y-auto pr-0.5">
                  {filteredItems.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">No items found.</p>
                  ) : (
                    filteredItems.map((item) => (
                      <DraggableItem key={item._id} item={item} />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ── Right: canvas + form ───────────────── */}
            <div className="lg:col-span-8 space-y-5">
              {/* Canvas */}
              <div className="bg-surface p-4 sm:p-5 rounded-2xl shadow-soft border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900">
                    Canvas
                    {canvasItems.length > 0 && (
                      <span className="ml-2 text-xs font-normal text-gray-400">
                        ({canvasItems.length} item{canvasItems.length !== 1 ? "s" : ""})
                      </span>
                    )}
                  </h3>
                  {canvasItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCanvasItems([])}
                      className="text-xs text-red-400 hover:text-red-500 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <CanvasDropZone items={canvasItems} onRemove={removeFromCanvas} />
              </div>

              {/* Outfit details */}
              <div className="bg-surface p-4 sm:p-5 rounded-2xl shadow-soft border border-gray-100">
                <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                  Outfit Details
                </h3>
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Outfit Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Winter Workwear"
                      value={outfitName}
                      onChange={(e) => setOutfitName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200
                        focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Describe this outfit…"
                      value={outfitDescription}
                      onChange={(e) => setOutfitDescription(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200
                        focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Season */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
                      <select
                        value={season}
                        onChange={(e) => setSeason(e.target.value as (typeof SEASONS)[number])}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200
                          focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white"
                      >
                        {SEASONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                      <div className="flex gap-2">
                        <input
                          ref={tagInputRef}
                          type="text"
                          placeholder="Add tag…"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); addTag(); }
                          }}
                          className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-gray-200
                            focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                        <button
                          type="button"
                          onClick={addTag}
                          className="px-4 py-3 rounded-xl bg-primary-50 text-primary-600
                            hover:bg-primary-100 font-medium text-sm transition-colors whitespace-nowrap"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tag pills */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs
                            font-medium bg-primary-50 text-primary-700"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                            className="hover:text-primary-900 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-medium text-gray-700
                    bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto flex items-center justify-center px-6 py-3 rounded-xl
                    font-medium text-white bg-primary-600 hover:bg-primary-700
                    disabled:opacity-60 transition-colors shadow-sm"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {saving ? "Saving…" : "Save Outfit"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Drag overlay */}
      <DragOverlay dropAnimation={null}>
        {activeItem ? <GhostCard item={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  );
};
