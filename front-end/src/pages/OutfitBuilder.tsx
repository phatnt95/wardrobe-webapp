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
import { Rnd } from "react-rnd";
import {
  ArrowLeft,
  Save,
  X,
  Image as ImageIcon,
  Search,
  Loader2,
} from "lucide-react";
import { getItems } from "../api/endpoints/items/items";
import { getOutfits } from "../api/endpoints/outfits/outfits";
import toast from "react-hot-toast";

const { itemsControllerFindAll, itemsControllerFindAllAttributes } = getItems();
const { outfitsControllerCreate } = getOutfits();

const SEASONS = ["All", "Spring", "Summer", "Autumn", "Winter"] as const;

// ─── Z-Index ordering ─────────────────────────────────────────────────────────
const getZIndex = (categoryName?: string): number => {
  if (!categoryName) return 35;
  const key = categoryName.toLowerCase().trim();
  if (['jacket', 'coat', 'outer wear', 'outerwear'].includes(key)) return 40;
  if (['top', 'shirt', 'tshirt', 't-shirt', 'blouse', 'sweater', 'hoodie'].includes(key)) return 30;
  if (['bottom', 'pants', 'skirt', 'shorts', 'jeans', 'trouser', 'trousers'].includes(key)) return 20;
  if (['shoes', 'shoe', 'sneakers', 'boots', 'sandals'].includes(key)) return 15;
  if (['hat', 'cap', 'headwear', 'beanie'].includes(key)) return 50;
  return 35;
};

// ─── Types ───────────────────────────────────────────────────────────────────
type ItemData = {
  _id: string;
  name: string;
  images?: string[];
  category?: { _id: string; name: string } | string;
};

type CanvasItem = ItemData & {
  canvasId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
};

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

// ─── Categorized droppable canvas ────────────────────────────────────────────
const CanvasDropZone = ({
  items,
  onRemove,
  onUpdate,
}: {
  items: CanvasItem[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<CanvasItem>) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas" });

  const isEmpty = items.length === 0;

  return (
    <div
      ref={setNodeRef}
      className={`relative w-full h-[600px] border-2 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center transition-colors
        ${isOver ? "bg-primary-50/60 border-primary-400" : "bg-gray-50 border-gray-300 border-dashed"}`}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-30">
        <div className="w-1/3 h-3/4 border-4 border-gray-300 rounded-[50px] flex items-center justify-center flex-col">
          <div className="w-16 h-16 border-4 border-gray-300 rounded-full mb-2"></div>
          <span className="text-gray-400 font-bold uppercase tracking-widest">Model Base</span>
        </div>
      </div>

      {isEmpty && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
          <p className="text-gray-400 font-medium">Drop items here to build your outfit</p>
        </div>
      )}

      {items.map((item) => {
        const imgSrc = getItemImage(item);
        return (
          <Rnd
            key={item.canvasId}
            size={{ width: item.width, height: item.height }}
            position={{ x: item.x, y: item.y }}
            onDragStop={(_e, d) => {
              onUpdate(item.canvasId, { x: d.x, y: d.y });
            }}
            onResizeStop={(_e, _direction, ref, _delta, position) => {
              onUpdate(item.canvasId, {
                width: parseInt(ref.style.width, 10),
                height: parseInt(ref.style.height, 10),
                ...position,
              });
            }}
            bounds="parent"
            style={{ zIndex: item.zIndex }}
            className="group absolute"
          >
            <div className="relative w-full h-full bg-transparent border border-transparent group-hover:border-primary-400 group-hover:border-dashed transition-colors flex items-center justify-center">
              {imgSrc ? (
                <img src={imgSrc} alt={item.name} className="w-full h-full object-contain pointer-events-none" />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded text-gray-400">No Image</div>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(item.canvasId); }}
                className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-[9999]"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </Rnd>
        );
      })}
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
        {
          ...item,
          canvasId: `${item._id}-${Date.now()}`,
          x: 50,
          y: 50,
          width: 150,
          height: 150,
          zIndex: getZIndex(getCategoryName(item)),
        },
      ]);
    }
  };

  const removeFromCanvas = (canvasId: string) =>
    setCanvasItems((prev) => prev.filter((i) => i.canvasId !== canvasId));

  const updateCanvasItem = (canvasId: string, updates: Partial<CanvasItem>) => {
    setCanvasItems((prev) =>
      prev.map((item) => (item.canvasId === canvasId ? { ...item, ...updates } : item))
    );
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
    tagInputRef.current?.focus();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outfitName.trim() || canvasItems.length === 0) {
      toast.error("Please give your outfit a name and add at least one item.");
      return;
    }
    setSaving(true);
    try {
      await outfitsControllerCreate({
        name: outfitName.trim(),
        description: outfitDescription.trim() || undefined,
        items: canvasItems.map((ci) => ({
          item: ci._id,
          x: ci.x,
          y: ci.y,
          width: ci.width,
          height: ci.height,
          zIndex: ci.zIndex,
        })),
        season: season as "All" | "Spring" | "Summer" | "Autumn" | "Winter",
        tags,
      });
      toast.success("Outfit saved!");
      navigate("/outfits");
    } catch (err: unknown) {
      console.error("Failed to save outfit", err);
      // Try to alert the specific validation message
      let msg = "Failed to save outfit. See console for details.";
      if (err instanceof Error) {
        msg += ` \\n${err.message}`;
      } else if (typeof err === "object" && err !== null && "response" in err) {
        const errorResponse = (err as { response?: { data?: { message?: string | string[] } } }).response;
        if (errorResponse?.data?.message) {
          msg += ` \\n${Array.isArray(errorResponse.data.message) ? errorResponse.data.message.join(', ') : errorResponse.data.message}`;
        }
      }
      toast.error(msg, { duration: 5000 });
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
                <CanvasDropZone items={canvasItems} onRemove={removeFromCanvas} onUpdate={updateCanvasItem} />
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
                    disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5 mr-2" />
                  )}
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
