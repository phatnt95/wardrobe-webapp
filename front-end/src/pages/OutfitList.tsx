import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, CalendarDays, Image as ImageIcon, Layers } from "lucide-react";


import { outfitsControllerFindAll  } from "../api/endpoints/outfits/outfits";

// ─── Types ─────────────────────────────────────────────────────────────────────

type OutfitItem = {
  _id: string;
  name: string;
  images?: string[];
};

type Outfit = {
  _id: string;
  name: string;
  description?: string;
  season?: string;
  tags?: string[];
  items?: OutfitItem[];
};

// ─── OutfitCard Props Interface ────────────────────────────────────────────────

interface OutfitCardProps {
  /** Display title of the outfit */
  title: string;
  /** Season value, e.g. "All", "Summer", "Winter" */
  season?: string;
  /** Array of items that compose the outfit */
  items: OutfitItem[];
  /** Click handler for navigating to detail */
  onClick: () => void;
}

// ─── Season badge color map ────────────────────────────────────────────────────

const SEASON_COLORS: Record<string, string> = {
  Spring: "bg-green-50 text-green-700",
  Summer: "bg-yellow-50 text-yellow-700",
  Autumn: "bg-orange-50 text-orange-700",
  Fall:   "bg-orange-50 text-orange-700",
  Winter: "bg-blue-50 text-blue-700",
  All:    "bg-gray-100 text-gray-600",
};

// ─── OutfitCollage ─────────────────────────────────────────────────────────────
// Handles dynamic CSS Grid layout based on number of images:
//   1 image  → full-width single image
//   2 images → two equal columns side-by-side
//   3 images → left col spans full height (2/3), right col has 2 stacked images
//   4+ images→ 2×2 grid showing first 4 images

interface OutfitCollageProps {
  /** Up to 4 image URL strings to display in the collage */
  images: string[];
  /** Alt text base for accessibility */
  altBase: string;
}

const OutfitCollage = ({ images, altBase }: OutfitCollageProps) => {
  // No images: show placeholder
  if (images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <ImageIcon className="w-10 h-10 text-gray-300" />
      </div>
    );
  }

  // 1 image: single full-size image
  if (images.length === 1) {
    return (
      <img
        src={images[0]}
        alt={altBase}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
    );
  }

  // 2 images: two equal columns
  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 h-full gap-px bg-gray-200">
        {images.map((src, idx) => (
          <img
            key={idx}
            src={src}
            alt={`${altBase} ${idx + 1}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ))}
      </div>
    );
  }

  // 3 images: left image takes 2/3 width (row-span full), right column has 2 stacked images
  if (images.length === 3) {
    return (
      <div
        className="grid h-full gap-px bg-gray-200"
        style={{ gridTemplateColumns: "2fr 1fr", gridTemplateRows: "1fr 1fr" }}
      >
        {/* Large left image spanning both rows */}
        <img
          src={images[0]}
          alt={`${altBase} 1`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          style={{ gridRow: "1 / 3" }}
        />
        {/* Top-right smaller image */}
        <img
          src={images[1]}
          alt={`${altBase} 2`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Bottom-right smaller image */}
        <img
          src={images[2]}
          alt={`${altBase} 3`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
    );
  }

  // 4+ images: 2×2 grid showing first 4
  return (
    <div className="grid grid-cols-2 grid-rows-2 h-full gap-px bg-gray-200">
      {images.slice(0, 4).map((src, idx) => (
        <img
          key={idx}
          src={src}
          alt={`${altBase} ${idx + 1}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ))}
    </div>
  );
};

// ─── OutfitCard ────────────────────────────────────────────────────────────────

const OutfitCard = ({ title, season, items, onClick }: OutfitCardProps) => {
  // Collect up to 4 preview images from the outfit's items
  const previewImages = items
    .filter((i) => i.images && i.images.length > 0)
    .slice(0, 4)
    .map((i) => i.images![0]);

  const itemCount = items.length;
  const seasonColorClass = season
    ? (SEASON_COLORS[season] ?? SEASON_COLORS.All)
    : SEASON_COLORS.All;

  return (
    <div
      className="bg-surface rounded-2xl shadow-soft hover:shadow-soft-lg transform hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer group border border-gray-100"
      onClick={onClick}
    >
      {/* ── Image Collage Section ── */}
      <div className="relative h-52 bg-gray-100 overflow-hidden">
        <OutfitCollage images={previewImages} altBase={title} />
      </div>

      {/* ── Card Body / Information Section ── */}
      <div className="p-4 flex flex-col gap-2">
        {/* 1. Title */}
        <h3 className="font-semibold text-gray-900 truncate leading-tight">
          {title}
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          {/* 2. Season Badge — calendar icon + label in rounded pill */}
          {season && (
            <span
              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${seasonColorClass}`}
            >
              <CalendarDays className="w-3 h-3 shrink-0" />
              {season}
            </span>
          )}

          {/* 3. Item count */}
          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
            <Layers className="w-3 h-3" />
            {itemCount} {itemCount === 1 ? "piece" : "pieces"}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── OutfitList Page ───────────────────────────────────────────────────────────

export const OutfitList = () => {
  const navigate = useNavigate();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    outfitsControllerFindAll()
      .then((res: unknown) => {
        if (Array.isArray(res)) setOutfits(res as Outfit[]);
      })
      .catch((err) => console.error("Failed to load outfits", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Outfits</h2>
        <p className="text-gray-500 mt-2">
          Browse and manage your curated outfit collections.
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-400">
          Loading outfits…
        </div>
      ) : outfits.length === 0 ? (
        <div className="py-24 text-center text-gray-500">
          <ImageIcon className="w-12 h-12 opacity-20 mx-auto mb-4" />
          <p className="text-lg font-medium">No outfits yet.</p>
          <p className="text-sm mt-1">Click the&nbsp;+ button to build your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-24">
          {outfits.map((outfit) => (
            <OutfitCard
              key={outfit._id}
              title={outfit.name}
              season={outfit.season}
              items={outfit.items ?? []}
              onClick={() => navigate(`/outfits/${outfit._id}`)}
            />
          ))}
        </div>
      )}

      {/* FAB — Create new outfit */}
      <button
        onClick={() => navigate("/outfits/new")}
        className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-primary-200 z-40"
        aria-label="Create new outfit"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};
