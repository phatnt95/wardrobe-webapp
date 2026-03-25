import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Tag, CalendarDays, Image as ImageIcon } from "lucide-react";
import { getOutfits } from "../api/endpoints/outfits/outfits";

const { outfitsControllerFindAll } = getOutfits();

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

export const OutfitList = () => {
  const navigate = useNavigate();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    outfitsControllerFindAll()
      .then((res: unknown) => {
        if (res) setOutfits(res as Outfit[]);
      })
      .catch((err) => console.error("Failed to load outfits", err))
      .finally(() => setLoading(false));
  }, []);

  const seasonColors: Record<string, string> = {
    Spring: "bg-green-50 text-green-700",
    Summer: "bg-yellow-50 text-yellow-700",
    Autumn: "bg-orange-50 text-orange-700",
    Winter: "bg-blue-50 text-blue-700",
    All: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Outfits</h2>
        <p className="text-gray-500 mt-2">
          Browse and manage your curated outfit collections.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-400">
          Loading outfits…
        </div>
      ) : outfits.length === 0 ? (
        <div className="col-span-full py-24 text-center text-gray-500">
          <p className="text-lg font-medium">No outfits yet.</p>
          <p className="text-sm mt-1">Click the&nbsp;+&nbsp;button to build your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-20">
          {outfits.map((outfit) => {
            const previewImages = (outfit.items ?? [])
              .filter((i) => i.images && i.images.length > 0)
              .slice(0, 4)
              .map((i) => i.images![0]);

            return (
              <div
                key={outfit._id}
                className="bg-surface rounded-2xl shadow-soft hover:shadow-soft-lg transform hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer group border border-gray-100"
                onClick={() => navigate(`/outfits/${outfit._id}`)}
              >
                {/* Image mosaic */}
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                  {previewImages.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-gray-300" />
                    </div>
                  ) : previewImages.length === 1 ? (
                    <img
                      src={previewImages[0]}
                      alt={outfit.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="grid grid-cols-2 h-full">
                      {previewImages.slice(0, 4).map((src, idx) => (
                        <img
                          key={idx}
                          src={src}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate mb-2">
                    {outfit.name}
                  </h3>

                  <div className="flex items-center gap-2 flex-wrap">
                    {outfit.season && (
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                          seasonColors[outfit.season] ?? seasonColors.All
                        }`}
                      >
                        <CalendarDays className="w-3 h-3" />
                        {outfit.season}
                      </span>
                    )}
                    {(outfit.tags ?? []).slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-medium"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-gray-400 mt-2">
                    {(outfit.items ?? []).length} piece
                    {(outfit.items ?? []).length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => navigate("/outfits/new")}
        className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-primary-200 z-40"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};
