import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  Sparkles,
  Shirt,
  Plus,
  TrendingUp,
  Clock,
  RefreshCw,
  MapPin,
  BarChart2,
} from 'lucide-react';
import { getDashboard } from '../api/endpoints/dashboard/dashboard';
import type {
  DashboardResponseDto,
  OotdItemDto,
} from '../api/model';

// ─── Local runtime helper ─────────────────────────────────────────────────────
// The backend returns `category` / `color` as a populated Mongoose object
// { _id, name } even though the OpenAPI schema declares them as `string`.
/** Safely extract a display string from either shape */
const nameOf = (v: unknown): string => {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v !== null && 'name' in v)
    return (v as { name: string }).name ?? '';
  return '';
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const WeatherIcon = ({ condition, className }: { condition: string; className?: string }) => {
  const c = condition?.toLowerCase() ?? '';
  if (c.includes('snow') || c.includes('sleet'))
    return <CloudSnow className={className} />;
  if (c.includes('thunder') || c.includes('storm'))
    return <CloudLightning className={className} />;
  if (c.includes('rain') || c.includes('drizzle'))
    return <CloudRain className={className} />;
  if (c.includes('cloud') || c.includes('mist') || c.includes('fog'))
    return <Cloud className={className} />;
  if (c.includes('wind'))
    return <Wind className={className} />;
  return <Sun className={className} />;
};

const weatherGradient = (condition: string): string => {
  const c = condition?.toLowerCase() ?? '';
  if (c.includes('snow')) return 'from-sky-300 via-slate-200 to-white';
  if (c.includes('thunder') || c.includes('storm')) return 'from-gray-700 via-gray-600 to-slate-500';
  if (c.includes('rain') || c.includes('drizzle')) return 'from-slate-600 via-blue-600 to-indigo-500';
  if (c.includes('cloud') || c.includes('mist') || c.includes('fog')) return 'from-gray-400 via-slate-400 to-blue-300';
  return 'from-amber-400 via-orange-400 to-sky-400'; // sunny
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="animate-pulse bg-white rounded-2xl shadow-soft overflow-hidden border border-gray-100">
    <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-44 w-full" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-gray-200 rounded-full w-3/4" />
      <div className="h-3 bg-gray-100 rounded-full w-1/2" />
    </div>
  </div>
);

const SkeletonBanner = () => (
  <div className="animate-pulse rounded-3xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 h-40 w-full" />
);

interface OutfitCardProps {
  // Cast to `any` locally because the backend's .populate() returns
  // { _id, name } objects for category/color despite the OpenAPI schema
  // saying string — we handle that at runtime with nameOf().
  item: OotdItemDto;
  onClick: () => void;
}

const OutfitCard = ({ item, onClick }: OutfitCardProps) => {
  const categoryLabel = nameOf(item.category);
  const colorLabel = nameOf(item.color);
  return (
    <div
      onClick={onClick}
      className="group flex-shrink-0 w-44 bg-white rounded-2xl shadow-soft hover:shadow-soft-lg border border-gray-100 overflow-hidden cursor-pointer transform hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative h-44 bg-gray-50 overflow-hidden">
        {item.images?.[0] ? (
          <img
            src={item.images[0]}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
            <Shirt className="w-12 h-12 text-primary-300" />
          </div>
        )}
        {/* Color dot — only render if we have a usable CSS color string */}
        {colorLabel && (
          <div
            className="absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white shadow-sm"
            title={colorLabel}
            style={{ backgroundColor: colorLabel.toLowerCase() }}
          />
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
        {categoryLabel && (
          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-medium">
            {categoryLabel}
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Greeting Helper ──────────────────────────────────────────────────────────

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const HomeDashboard = () => {
  const [data, setData] = useState<DashboardResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  // `locationReady` fires the fetch: set to true once we know where the user is
  // (or know that we can't find out).
  const [locationReady, setLocationReady] = useState(false);
  const navigate = useNavigate();

  // ── Step 1: Geolocation ────────────────────────────────────────────────────
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      // Browser doesn't support geolocation at all — go straight to backend default
      setLocationReady(true);
      return;
    }

    // Hard-cap: if the browser prompt is dismissed / never answered, fire after 1.5 s
    const fallbackTimer = setTimeout(() => setLocationReady(true), 1500);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(fallbackTimer);
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocationReady(true);
      },
      (_err) => {
        // Covers: PERMISSION_DENIED, POSITION_UNAVAILABLE, TIMEOUT
        // Fire immediately instead of waiting for the 1.5 s fallback
        clearTimeout(fallbackTimer);
        setLocationReady(true); // coords stays null → backend will use its default
      },
      { timeout: 5000 }
    );

    return () => clearTimeout(fallbackTimer);
  }, []);

  // ── Step 2: Fetch dashboard once location outcome is known ─────────────────
  const { dashboardControllerGetHomeDashboard } = getDashboard();

  const fetchDashboard = (lat?: number, lon?: number) => {
    setLoading(true);
    setError(null);
    dashboardControllerGetHomeDashboard(
      lat != null && lon != null ? { lat, lon } : undefined
    )
      .then((res) => setData(res as DashboardResponseDto))
      .catch(() => setError('Failed to load dashboard. Please try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (locationReady) {
      fetchDashboard(coords?.lat, coords?.lon);
    }
  }, [locationReady]);

  const handleRefresh = () => fetchDashboard(coords?.lat, coords?.lon);


  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 pb-10">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {getGreeting()} 👋
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Here's your wardrobe summary & today's outfit pick.
          </p>
        </div>
        <button
          id="dashboard-refresh-btn"
          onClick={handleRefresh}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-sm font-medium shadow-sm transition-all duration-200"
          title="Refresh dashboard"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 text-red-700 px-5 py-4 text-sm font-medium">
          {error}
        </div>
      )}

      {/* ── Top Row: Weather + Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Weather Widget */}
        {loading ? (
          <SkeletonBanner />
        ) : data?.weather ? (
          <div
            className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${weatherGradient(data.weather.condition)} p-6 text-white shadow-soft-lg`}
          >
            {/* Background circles for depth */}
            <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
            <div className="absolute -bottom-10 -left-6 w-32 h-32 bg-white/10 rounded-full" />

            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1 text-white/80 text-xs font-semibold uppercase tracking-widest">
                  <MapPin className="w-3.5 h-3.5" />
                  {data.weather.cityName}
                </div>
                <div className="text-7xl font-bold leading-none">
                  {Math.round(data.weather.temperature)}°
                </div>
                <div className="mt-2 capitalize text-white/90 font-medium text-base">
                  {data.weather.description}
                </div>
                <div className="mt-3 flex gap-4 text-white/75 text-xs font-medium">
                  <span className="flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5" />
                    {data.weather.humidity}%
                  </span>
                  <span className="flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5" />
                    Feels {Math.round(data.weather.feelsLike)}°
                  </span>
                </div>
              </div>
              <WeatherIcon condition={data.weather.condition} className="w-20 h-20 text-white/80 drop-shadow-xl" />
            </div>
          </div>
        ) : null}

        {/* Wardrobe Stats */}
        {loading ? (
          <SkeletonBanner />
        ) : data?.stats ? (
          <div className="rounded-3xl bg-white border border-gray-100 shadow-soft p-6 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">
              <BarChart2 className="w-4 h-4" />
              Wardrobe Stats
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-primary-50 rounded-2xl p-4 text-center">
                <div className="text-4xl font-bold text-primary-600">
                  {data.stats.totalItems}
                </div>
                <div className="text-xs text-primary-500 font-medium mt-1">Total Items</div>
              </div>
              <div className="bg-amber-50 rounded-2xl p-4 text-center">
                <div className="text-4xl font-bold text-amber-600">
                  {data.stats.totalValue.toLocaleString('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                    maximumFractionDigits: 0,
                  })}
                </div>
                <div className="text-xs text-amber-600 font-medium mt-1">Est. Value</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ── AI Stylist: OOTD ── */}
      <section id="ootd-section">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">AI Stylist · Outfit of the Day</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {data?.ootd?.source === 'ai' ? 'Powered by Gemini AI' : 'Rule-based recommendation'}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {/* Reason skeleton */}
            <div className="animate-pulse rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 p-5">
              <div className="h-4 bg-violet-100 rounded-full w-5/6 mb-2" />
              <div className="h-4 bg-violet-100 rounded-full w-3/4" />
            </div>
            {/* Cards skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
            <p className="text-center text-xs text-gray-400 italic animate-pulse mt-2">
              ✨ AI is picking the perfect outfit for you…
            </p>
          </div>
        )}

        {/* Empty / Refusal State */}
        {!loading && data?.ootd && data.ootd.items.length === 0 && (
          <div className="rounded-3xl border-2 border-dashed border-violet-200 bg-violet-50/50 p-10 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center">
                <Shirt className="w-8 h-8 text-violet-400" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">AI couldn't find a match</h3>
            {data.ootd.reason && (
              <p className="text-gray-500 text-sm max-w-md mx-auto mb-6 leading-relaxed italic">
                "{data.ootd.reason}"
              </p>
            )}
            <button
              id="ootd-add-item-btn"
              onClick={() => navigate('/add')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:opacity-90 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Thêm đồ mới vào tủ
            </button>
          </div>
        )}

        {/* Success State */}
        {!loading && data?.ootd && data.ootd.items.length > 0 && (
          <div className="space-y-4">
            {/* AI badge + reason callout */}
            {data.ootd.reason && (
              <div className="relative rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 px-5 py-4">
                <span className="absolute -top-2.5 left-5 px-2 py-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-bold rounded-full uppercase tracking-widest shadow">
                  AI Stylist
                </span>
                <p className="text-gray-700 text-sm leading-relaxed italic mt-1">
                  "{data.ootd.reason}"
                </p>
              </div>
            )}

            {/* Outfit cards — horizontal scroll on mobile, grid on sm+ */}
            <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:overflow-visible">
              {data.ootd.items.map((item) => (
                <OutfitCard
                  key={item._id}
                  item={item}
                  onClick={() => navigate(`/item/${item._id}`)}
                />
              ))}
            </div>

            {/* Source badge */}
            {data.ootd.source === 'fallback' && (
              <p className="text-center text-xs text-gray-400 italic">
                ⚡ Gemini unavailable — showing rule-based suggestion
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── Recent Items ── */}
      {(loading || (data?.recentItems && data.recentItems.length > 0)) && (
        <section id="recent-items-section">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900">Recently Added</h2>
            <button
              onClick={() => navigate('/')}
              className="ml-auto text-xs font-semibold text-primary-600 hover:underline"
            >
              View all →
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {data!.recentItems.map((item) => (
                <div
                  key={item._id}
                  onClick={() => navigate(`/item/${item._id}`)}
                  className="group bg-white rounded-2xl shadow-soft hover:shadow-soft-lg border border-gray-100 overflow-hidden cursor-pointer transform hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="h-36 bg-gray-50 overflow-hidden">
                    {item.images?.[0] ? (
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <Shirt className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Quick Actions ── */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gray-400" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            id="quick-add-item-btn"
            onClick={() => navigate('/add')}
            className="flex items-center gap-3 px-5 py-4 bg-white border border-gray-100 rounded-2xl shadow-soft hover:shadow-soft-lg hover:bg-gray-50 transition-all duration-200 text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
              <Plus className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Add Item</p>
              <p className="text-xs text-gray-400">Grow your wardrobe</p>
            </div>
          </button>
          <button
            id="quick-view-outfits-btn"
            onClick={() => navigate('/outfits')}
            className="flex items-center gap-3 px-5 py-4 bg-white border border-gray-100 rounded-2xl shadow-soft hover:shadow-soft-lg hover:bg-gray-50 transition-all duration-200 text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center group-hover:bg-violet-200 transition-colors">
              <Shirt className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">My Outfits</p>
              <p className="text-xs text-gray-400">Browse saved looks</p>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
};
