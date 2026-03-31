import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit3, Trash2, Calendar, Tag, DollarSign, Image as ImageIcon } from "lucide-react";
import { getOutfits } from "../api/endpoints/outfits/outfits";
import toast from "react-hot-toast";

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface PopulatedItem {
  _id: string;
  name: string;
  brand?: string;
  price?: number;
  images?: string[];
  category?: { _id: string; name: string } | string;
}

interface OutfitItemData {
  item: PopulatedItem;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

interface OutfitData {
  _id: string;
  name: string;
  description?: string;
  tags?: string[];
  season?: string;
  items: OutfitItemData[];
  createdAt: string;
}

const { outfitsControllerFindOne, outfitsControllerRemove } = getOutfits();

// ─── Custom Hook ────────────────────────────────────────────────────────────
function useOutfitDetail(id: string | undefined) {
  const [outfit, setOutfit] = useState<OutfitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    outfitsControllerFindOne(id)
      .then((res: unknown) => {
        setOutfit(res as OutfitData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load outfit");
        setLoading(false);
      });
  }, [id]);

  return { outfit, loading, error };
}

// ─── Helper ──────────────────────────────────────────────────────────────────
const getCategoryName = (item: PopulatedItem): string =>
  typeof item.category === "object" ? item.category?.name || "Uncategorized" : item.category || "Uncategorized";

const getItemImage = (item: PopulatedItem) =>
  item.images && item.images.length > 0 ? item.images[0] : null;

// ─── Component ───────────────────────────────────────────────────────────────
export const OutfitDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { outfit, loading, error } = useOutfitDetail(id);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!id || !window.confirm("Are you sure you want to delete this outfit?")) return;
    setDeleting(true);
    try {
      await outfitsControllerRemove(id);
      navigate("/outfits");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete outfit.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !outfit) {
    return (
      <div className="flex h-[calc(100vh-80px)] flex-col items-center justify-center text-center">
        <p className="text-red-500 font-medium mb-4">{error || "Outfit not found"}</p>
        <button onClick={() => navigate("/outfits")} className="text-primary-600 font-medium hover:underline">
          Return to Outfits
        </button>
      </div>
    );
  }

  const totalPrice = outfit.items.reduce((sum, current) => {
    return sum + (current.item.price || 0);
  }, 0);

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              {outfit.name}
            </h2>
            <div className="flex items-center gap-4 text-gray-500 mt-1 text-sm sm:text-base">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1.5" />
                {new Date(outfit.createdAt).toLocaleDateString()}
              </span>
              {outfit.season && outfit.season !== "All" && (
                <span className="flex items-center">
                  <Tag className="w-4 h-4 mr-1.5" />
                  {outfit.season}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Actions ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center px-4 py-2.5 rounded-xl font-medium text-red-600 bg-red-50 
              hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
          <button
            onClick={() => navigate('/outfits/new')}
            className="flex items-center px-5 py-2.5 rounded-xl font-medium text-white bg-primary-600 
              hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit View
          </button>
        </div>
      </div>

      {/* ── Responsive Split View ────────────────────────────── */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* ── Left: Canvas Reconstruction ───────────────────── */}
        <div className="lg:col-span-7">
          <div className="bg-surface p-4 sm:p-5 rounded-2xl shadow-soft border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Styling View</h3>
            
            {/* The read-only 2D Canvas */}
            <div className="relative w-full h-[600px] border-2 border-gray-100 rounded-xl overflow-hidden shadow-inner bg-gray-50 flex items-center justify-center">
              
              {/* Model Base */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-30">
                <div className="w-1/3 h-3/4 border-4 border-gray-300 rounded-[50px] flex items-center justify-center flex-col">
                  <div className="w-16 h-16 border-4 border-gray-300 rounded-full mb-2"></div>
                  <span className="text-gray-400 font-bold uppercase tracking-widest">Model Base</span>
                </div>
              </div>

              {/* Mapped Clothing Items */}
              {outfit.items.map((outfitItem, index) => {
                const item = outfitItem.item;
                if (!item) return null;
                const imgSrc = getItemImage(item);
                
                return (
                  <div
                    key={`${item._id}-${index}`}
                    className="absolute"
                    style={{
                      left: `${outfitItem.x}px`,
                      top: `${outfitItem.y}px`,
                      width: `${outfitItem.width}px`,
                      height: `${outfitItem.height}px`,
                      zIndex: outfitItem.zIndex,
                    }}
                  >
                    {imgSrc ? (
                      <img 
                        src={imgSrc} 
                        alt={item.name} 
                        className="w-full h-full object-contain drop-shadow-md"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 border border-dashed border-gray-300 flex items-center justify-center rounded">
                        <span className="text-xs text-gray-400">No Image</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right: Outfit Details & Item List ─────────────── */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Metadata Card */}
          <div className="bg-surface p-5 rounded-2xl shadow-soft border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-3 border-b border-gray-100 pb-2">
              Outfit Details
            </h3>
            {outfit.description && (
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">{outfit.description}</p>
            )}
            
            {/* Tags */}
            {outfit.tags && outfit.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {outfit.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            {/* Total Price Metric */}
            {totalPrice > 0 && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 mt-2">
                <span className="text-gray-600 font-medium text-sm">Total Outfit Value</span>
                <span className="text-lg font-bold text-gray-900 flex items-center">
                  <DollarSign className="w-5 h-5 text-gray-400 mr-0.5" />
                  {totalPrice.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Included Items List */}
          <div className="bg-surface p-5 rounded-2xl shadow-soft border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2 flex justify-between items-center">
              <span>Included Items</span>
              <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{outfit.items.length}</span>
            </h3>
            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
              {outfit.items.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No items selected for this outfit.</p>
              ) : (
                outfit.items.map((outfitItem, idx) => {
                  const item = outfitItem.item;
                  if (!item) return null;
                  const imgSrc = getItemImage(item);
                  
                  return (
                    <div 
                      key={`list-${item._id}-${idx}`} 
                      className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/item/${item._id}`)}
                    >
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-200">
                        {imgSrc ? (
                          <img src={imgSrc} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {getCategoryName(item)} {item.brand ? ` • ${item.brand}` : ''}
                        </p>
                      </div>
                      
                      {/* Price */}
                      {item.price ? (
                        <div className="font-semibold text-gray-700 text-sm">
                          ${item.price.toFixed(2)}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">--</div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
