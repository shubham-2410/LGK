import { getApiUrl } from "@/lib/queryClient";
import { AppLayout } from "@/components/layout";
import { BannerSlider } from "@/components/banner-slider";
import { useServices } from "@/hooks/use-services";
import { useInclusions } from "@/hooks/use-inclusions";
import { usePaymentSettings } from "@/hooks/use-payment-settings";
import { useCategories } from "@/hooks/use-categories";
import { useAuth } from "@/hooks/use-auth";
import { InclusionIcon } from "@/lib/inclusion-icons";
import { Link } from "wouter";
import { Clock, Users, ArrowRight, Images, CheckCircle2, ChevronDown, ChevronUp, Share2, Check, Search, X, Play, Waves, RefreshCw } from "lucide-react";
import { SiYoutube, SiInstagram } from "react-icons/si";
import mockImage from "@assets/image_1772364975598.png";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────
type TideEvent = { time: string; height: number; type: "HIGH" | "LOW" };
type TideResponse = { data: TideEvent[] };
type TideSettingsData = { stormglassApiKey: string; locationName: string; latitude: string; longitude: string; showOnHome: boolean };

// ─── Tide Mini Chart ──────────────────────────────────────────────────────────
// Kayaking activity windows to highlight on the chart
const ACTIVITY_BANDS = [
  { start: 6 * 60, end: 8 * 60, label: "6–8 AM", color: "#22c55e" },     // green
  { start: 12 * 60, end: 14 * 60, label: "12–2 PM", color: "#f59e0b" },  // amber
  { start: 16 * 60, end: 19 * 60, label: "4–7 PM", color: "#a855f7" },   // purple
] as const;

function minuteFrac(min: number) { return min / (24 * 60); }

function TideMiniChart({ events }: { events: TideEvent[] }) {
  if (events.length < 2) return null;

  const W = 500; const H = 130;
  const PAD_X = 14; const PAD_Y = 10; const PAD_BOTTOM = 28;
  const chartW = W - PAD_X * 2;
  const chartH = H - PAD_Y - PAD_BOTTOM;
  const chartBase = PAD_Y + chartH;

  const heights = events.map(e => e.height);
  const minH = Math.min(...heights); const maxH = Math.max(...heights);
  const rangeH = maxH - minH || 1;

  function toXY(e: TideEvent) {
    const istOffset = 5.5 * 60 * 60 * 1000;
    const ist = new Date(new Date(e.time).getTime() + istOffset);
    const frac = (ist.getUTCHours() * 60 + ist.getUTCMinutes()) / (24 * 60);
    return {
      x: PAD_X + frac * chartW,
      y: PAD_Y + chartH - ((e.height - minH) / rangeH) * chartH,
    };
  }

  const pts = events.map(toXY);
  let path = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    path += ` C ${mx} ${pts[i].y}, ${mx} ${pts[i + 1].y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
  }
  let fill = `M ${pts[0].x} ${chartBase} L ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    fill += ` C ${mx} ${pts[i].y}, ${mx} ${pts[i + 1].y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
  }
  fill += ` L ${pts[pts.length - 1].x} ${chartBase} Z`;


  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 130 }}>
      <defs>
        <linearGradient id="tideWidgetGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Baseline */}
      <line x1={PAD_X} y1={chartBase} x2={PAD_X + chartW} y2={chartBase} stroke="#e2e8f0" strokeWidth="1" />

      {/* Activity bands */}
      {ACTIVITY_BANDS.map((band, i) => {
        const x1 = PAD_X + minuteFrac(band.start) * chartW;
        const x2 = PAD_X + minuteFrac(band.end) * chartW;
        const midX = (x1 + x2) / 2;
        return (
          <g key={i}>
            <rect x={x1} y={PAD_Y} width={x2 - x1} height={chartH} fill={band.color} fillOpacity="0.10" rx="2" />
            <line x1={x1} y1={PAD_Y} x2={x1} y2={chartBase} stroke={band.color} strokeWidth="1" strokeDasharray="3 2" strokeOpacity="0.6" />
            <line x1={x2} y1={PAD_Y} x2={x2} y2={chartBase} stroke={band.color} strokeWidth="1" strokeDasharray="3 2" strokeOpacity="0.6" />
            <text x={midX} y={chartBase + 11} textAnchor="middle" fontSize="8" fill={band.color} fontWeight="600">{band.label}</text>
          </g>
        );
      })}


      {/* Tide curve fill + stroke */}
      <path d={fill} fill="url(#tideWidgetGrad)" />
      <path d={path} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* High / Low dots with height labels */}
      {events.map((e, i) => {
        const { x, y } = pts[i];
        const isHigh = e.type === "HIGH";
        const color = isHigh ? "#3b82f6" : "#f97316";
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={4.5} fill={color} stroke="white" strokeWidth="2" />
            <text x={x} y={isHigh ? y - 8 : y + 15} textAnchor="middle" fontSize="8" fill={color} fontWeight="700">
              {e.height.toFixed(1)}m
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function fmtTideTime(isoTime: string): string {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(new Date(isoTime).getTime() + istOffset);
  const h = ist.getUTCHours();
  const m = ist.getUTCMinutes().toString().padStart(2, "0");
  return `${h % 12 || 12}:${m} ${h >= 12 ? "PM" : "AM"}`;
}

// ─── Tide local cache helpers (per-date, multi-date store) ────────────────────
const TIDE_CACHE_KEY = "lkg_tide_cache_v2";

function readTideCacheForDate(date: string): { data: TideResponse; ts: number } | null {
  try {
    const raw = localStorage.getItem(TIDE_CACHE_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw) as Record<string, { data: TideResponse; ts: number }>;
    return all[date] ?? null;
  } catch { return null; }
}

function writeTideCacheForDate(date: string, data: TideResponse) {
  try {
    const raw = localStorage.getItem(TIDE_CACHE_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, { data: TideResponse; ts: number }>) : {};
    all[date] = { data, ts: Date.now() };
    localStorage.setItem(TIDE_CACHE_KEY, JSON.stringify(all));
  } catch {}
}

// ─── Tide Widget (admin-only home card) ───────────────────────────────────────
function TideWidget() {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const todayCache = readTideCacheForDate(todayStr);
  const [localData, setLocalData] = useState<TideResponse | null>(() => todayCache?.data ?? null);
  const [lastFetchTs, setLastFetchTs] = useState<number | null>(() => todayCache?.ts ?? null);
  const [isFetchingApi, setIsFetchingApi] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const { data: tideSettings } = useQuery<TideSettingsData>({
    queryKey: ["/api/admin/tide-settings"],
  });

  const hasKey = !!(tideSettings?.stormglassApiKey?.trim());
  const locationName = tideSettings?.locationName || "Colva, Goa";

  async function doFetchFromApi(date: string) {
    if (isFetchingApi || !hasKey) return;
    setIsFetchingApi(true);
    setFetchError(null);
    try {
      const res = await fetch(getApiUrl(`/api/admin/tide?date=${date}`));
      if (!res.ok) {
        const e = await res.json() as { message?: string };
        throw new Error(e.message || "Failed to fetch tide data");
      }
      const data = await res.json() as TideResponse;
      writeTideCacheForDate(date, data);
      setLocalData(data);
      setLastFetchTs(Date.now());
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "Failed to fetch";
      setFetchError(raw.toLowerCase().includes("quota") ? "Too many attempts. Try again later." : raw);
    } finally {
      setIsFetchingApi(false);
    }
  }

  // Auto-fetch today on first login of the day (no cache for today)
  useEffect(() => {
    if (hasKey && !readTideCacheForDate(todayStr)?.data) {
      doFetchFromApi(todayStr);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasKey]);

  function handleDateChange(newDate: string) {
    if (!newDate) return;
    setSelectedDate(newDate);
    setFetchError(null);
    const cached = readTideCacheForDate(newDate);
    if (cached) {
      setLocalData(cached.data);
      setLastFetchTs(cached.ts);
    } else {
      setLocalData(null);
      setLastFetchTs(null);
      doFetchFromApi(newDate);
    }
  }

  function handleRefreshClick() {
    if (!hasKey || isFetchingApi) return;
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    const isStale = !lastFetchTs || Date.now() - lastFetchTs >= TWO_HOURS;
    if (isStale) {
      doFetchFromApi(selectedDate);
    }
    // < 2 hours: cached data already shown — no API call
  }

  const TWO_HOURS = 2 * 60 * 60 * 1000;
  const isDataFresh = !!localData && !!lastFetchTs && Date.now() - lastFetchTs < TWO_HOURS;
  const refreshTitle = isFetchingApi
    ? "Fetching…"
    : isDataFresh
      ? "Data is up to date"
      : "Refresh tide data from API";

  const events: TideEvent[] = localData?.data ?? [];
  const isToday = selectedDate === todayStr;
  const dateLabel = isToday
    ? `Today · ${format(parseISO(selectedDate), "d MMM yyyy")}`
    : format(parseISO(selectedDate), "d MMM yyyy");

  if (!tideSettings || tideSettings.showOnHome === false) return null;

  return (
    <div className="mt-4 mb-5 bg-card border border-border rounded-2xl overflow-hidden shadow-sm" data-testid="widget-tide">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Waves className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">Tide Forecast</p>
            {/* Clickable date → native date picker via transparent overlay */}
            <div className="relative inline-flex items-center gap-1 mt-0.5 cursor-pointer group" title="Change date">
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                {locationName} · {dateLabel}
              </span>
              <ChevronDown className="w-3 h-3 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
              <input
                ref={dateInputRef}
                type="date"
                value={selectedDate}
                onChange={e => handleDateChange(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                data-testid="input-tide-date-picker"
              />
            </div>
          </div>
        </div>
        <button
          onClick={handleRefreshClick}
          disabled={isFetchingApi || !hasKey}
          className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-40"
          data-testid="button-refresh-tide"
          title={refreshTitle}
        >
          <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${isFetchingApi ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Content */}
      {!hasKey ? (
        <div className="px-4 pb-4 text-xs text-muted-foreground">
          No API key configured.{" "}
          <Link href="/settings" className="text-blue-500 underline">Set up in Settings → Sea Level Tracker</Link>
        </div>
      ) : isFetchingApi && !localData ? (
        <div className="px-4 pb-4 space-y-2">
          <Skeleton className="h-12 w-full rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 flex-1 rounded-lg" />
          </div>
        </div>
      ) : fetchError && events.length === 0 ? (
        <div className="px-4 pb-4 text-xs text-red-500">{fetchError}</div>
      ) : events.length === 0 ? (
        <div className="px-4 pb-4 text-xs text-muted-foreground">No tide data for {isToday ? "today" : format(parseISO(selectedDate), "d MMM")}.</div>
      ) : (
        <div className="px-3 pb-3">
          <div className="mb-2.5">
            <TideMiniChart events={events} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {events.map((e, i) => {
              const isHigh = e.type === "HIGH";
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 flex-1 min-w-[110px] rounded-xl px-3 py-2 border ${isHigh ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" : "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"}`}
                  data-testid={`tide-widget-event-${i}`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isHigh ? "bg-blue-500" : "bg-orange-500"}`} />
                  <div className="min-w-0">
                    <p className={`text-[11px] font-semibold leading-none ${isHigh ? "text-blue-700 dark:text-blue-300" : "text-orange-700 dark:text-orange-300"}`}>
                      {isHigh ? "High" : "Low"} · {e.height.toFixed(2)}m
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{fmtTideTime(e.time)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function formatDuration(duration: string): string {
  return duration.replace(/(\d+)\s*hours?/i, (_, n) => `${n}Hr${parseInt(n) !== 1 ? "s" : ""}`)
                 .replace(/(\d+)\s*nights?/i, (_, n) => `${n}Night${parseInt(n) !== 1 ? "s" : ""}`)
                 .replace(/(\d+)\s*days?/i, (_, n) => `${n}Day${parseInt(n) !== 1 ? "s" : ""}`);
}

export default function Home() {
  const { data: services, isLoading } = useServices();
  const { data: allInclusions } = useInclusions();
  const { data: paymentSettings } = usePaymentSettings();
  const { data: categories = [] } = useCategories();
  const { user } = useAuth();
  const [expandedDescId, setExpandedDescId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceSort, setPriceSort] = useState<"default" | "asc" | "desc">("default");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sortOpen) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sortOpen]);

  const sortLabels = { default: "Sort by Price", asc: "Price: Low → High", desc: "Price: High → Low" };

  const visibleCategories = (categories as any[]).filter(cat =>
    (services || []).some((s: any) => s.isActive && s.categoryId === cat.id)
  );

  // Build category sort order: by the minimum displaySequence in that category (nulls last), then by category list position
  const categoryOrder = (catId: number | null | undefined): number => {
    if (!catId) return 99999;
    const idx = visibleCategories.findIndex((c: any) => c.id === catId);
    const catServices = (services || []).filter((s: any) => s.isActive && s.categoryId === catId && (s as any).displaySequence != null);
    const minSeq = catServices.length > 0 ? Math.min(...catServices.map((s: any) => (s as any).displaySequence as number)) : 99998;
    return minSeq * 10000 + (idx >= 0 ? idx : 9999);
  };

  const defaultSort = (a: any, b: any) => {
    // Primary: category order (services without category/sequence last)
    const aHasCat = a.categoryId != null;
    const bHasCat = b.categoryId != null;
    if (aHasCat !== bHasCat) return aHasCat ? -1 : 1;
    if (aHasCat && bHasCat) {
      const catCmp = categoryOrder(a.categoryId) - categoryOrder(b.categoryId);
      if (catCmp !== 0) return catCmp;
      // Within same category: by displaySequence (null last), then price
      const aSeq = (a as any).displaySequence;
      const bSeq = (b as any).displaySequence;
      if (aSeq != null && bSeq != null) return aSeq - bSeq;
      if (aSeq != null) return -1;
      if (bSeq != null) return 1;
    }
    return a.price - b.price;
  };

  // Capture ?ref= from URL and persist in sessionStorage so it survives navigation to service pages
  const refCode = new URLSearchParams(window.location.search).get("ref")?.trim().toUpperCase() || null;
  useEffect(() => {
    if (refCode) sessionStorage.setItem("_ref", refCode);
  }, [refCode]);

  useEffect(() => {
    const keywords = (paymentSettings as any)?.seoKeywords;
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) return;
    let tag = document.querySelector('meta[name="keywords"]') as HTMLMetaElement | null;
    if (!tag) {
      tag = document.createElement("meta");
      tag.name = "keywords";
      document.head.appendChild(tag);
    }
    tag.content = keywords.join(", ");
  }, [paymentSettings]);

  const handleShare = (e: React.MouseEvent, service: { id: number; name: string }) => {
    e.preventDefault();
    e.stopPropagation();
    const base = paymentSettings?.siteUrl?.trim()
      ? paymentSettings.siteUrl.trim().replace(/\/$/, "")
      : window.location.origin;
    const slug = toSlug(service.name);
    const url = `${base}/service/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(service.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const toggleDesc = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedDescId(prev => prev === id ? null : id);
  };

  return (
    <AppLayout>
      <div className="sm:p-6 sm:pt-8 animate-in fade-in duration-500">
        <BannerSlider />

        {/* Tide widget — admin only */}
        {(user as any)?.isAdmin && <TideWidget />}
        
        <div className="px-4 py-8 sm:px-0">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground">Our Services</h2>
              <p className="text-muted-foreground mt-1">Experience the best of Goa's backwaters</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              data-testid="input-search-services"
              type="text"
              placeholder="Search services…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-9 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} data-testid="button-clear-search" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category tabs + Price sort — always shown when there are services */}
          <div className="flex items-center gap-3 mb-5">
            {visibleCategories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-0.5 flex-1 scrollbar-none min-w-0" data-testid="category-tabs">
                <button
                  data-testid="tab-category-all"
                  onClick={() => setSelectedCategoryId(null)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${selectedCategoryId === null ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
                >
                  All
                </button>
                {visibleCategories.map((cat: any) => (
                  <button
                    key={cat.id}
                    data-testid={`tab-category-${cat.id}`}
                    onClick={() => setSelectedCategoryId(prev => prev === cat.id ? null : cat.id)}
                    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${selectedCategoryId === cat.id ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
            <div ref={sortRef} className="relative flex-shrink-0" data-testid="price-sort-container">
              <button
                onClick={() => setSortOpen(o => !o)}
                data-testid="btn-price-sort"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors whitespace-nowrap ${priceSort !== "default" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
              >
                {sortLabels[priceSort]}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-50 bg-background border border-border rounded-xl shadow-lg min-w-[160px] overflow-hidden">
                  {(["default", "asc", "desc"] as const).map(opt => (
                    <button
                      key={opt}
                      data-testid={`sort-option-${opt}`}
                      onClick={() => { setPriceSort(opt); setSortOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted ${priceSort === opt ? "text-primary font-semibold bg-primary/5" : "text-foreground"}`}
                    >
                      {sortLabels[opt]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {services?.filter(s => s.isActive !== false)
                .filter(s => selectedCategoryId === null || (s as any).categoryId === selectedCategoryId)
                .filter(s => !searchQuery.trim() || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.description ?? "").toLowerCase().includes(searchQuery.toLowerCase()))
                .slice().sort((a, b) => priceSort === "asc" ? a.price - b.price : priceSort === "desc" ? b.price - a.price : defaultSort(a, b))
                .map((service) => {
                const serviceInclusions = allInclusions?.filter(inc =>
                  ((service as any).inclusionIds as number[] ?? []).includes(inc.id)
                ) ?? [];
                const isExpanded = expandedDescId === service.id;
                const hasLongDesc = service.description && (service.description.length > 120 || service.description.includes("\n"));

                return (
                  <div key={service.id} className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex flex-col h-full">
                    <Link href={`/service/${service.id}${refCode ? `?ref=${refCode}` : ""}`} className="group block">
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={service.imageUrl || mockImage}
                          alt={service.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {service.mrpPrice && service.mrpPrice > service.price ? (
                          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl shadow-md px-2.5 py-1.5 flex flex-col items-center">
                            <div className="text-xs text-muted-foreground line-through leading-none">₹{service.mrpPrice}</div>
                            <div className="text-sm font-bold text-primary leading-snug">₹{service.price} / {(service as any).priceType === "group" ? "Group" : (service as any).priceType === "night" ? "Night" : "Pax"}</div>
                            <div className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-0.5">{Math.round((1 - service.price / service.mrpPrice) * 100)}% OFF</div>
                          </div>
                        ) : (
                          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-bold text-primary shadow-sm">
                            ₹{service.price} / {(service as any).priceType === "group" ? "Group" : (service as any).priceType === "night" ? "Night" : "Pax"}
                          </div>
                        )}
                        <button
                          onClick={e => handleShare(e, service)}
                          data-testid={`button-share-service-${service.id}`}
                          className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white/90 backdrop-blur-sm rounded-full w-9 h-9 flex items-center justify-center shadow-sm hover:bg-white hover:scale-110"
                          title="Copy link"
                        >
                          {copiedId === service.id
                            ? <Check className="w-4 h-4 text-emerald-500" />
                            : <Share2 className="w-4 h-4 text-primary" />
                          }
                        </button>
                      </div>
                      <div className="px-5 pt-5 pb-3">
                        <h3 className="text-xl font-bold font-display mb-1.5 group-hover:text-primary transition-colors">{service.name}</h3>
                      </div>
                    </Link>

                    <div className="px-5 pb-3 flex-1 flex flex-col">
                      <p className={`text-muted-foreground text-sm mb-1 whitespace-pre-line ${isExpanded ? "" : "line-clamp-4"}`}>
                        {service.description}
                      </p>
                      {hasLongDesc && (
                        <button
                          onClick={e => toggleDesc(service.id, e)}
                          className="text-xs text-primary font-semibold flex items-center gap-0.5 mb-3 hover:opacity-70 transition-opacity self-start"
                          data-testid={`button-read-more-${service.id}`}
                        >
                          {isExpanded ? (
                            <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
                          ) : (
                            <><ChevronDown className="w-3.5 h-3.5" /> Read more</>
                          )}
                        </button>
                      )}

                      {serviceInclusions.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-primary" /> What's Included
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {serviceInclusions.map(inc => (
                              <span
                                key={inc.id}
                                className="flex items-center gap-1 bg-primary/8 text-primary border border-primary/15 rounded-full px-2.5 py-1 text-xs font-medium"
                              >
                                <InclusionIcon icon={inc.icon} className="w-3 h-3" />
                                {inc.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <Link href={`/service/${service.id}${refCode ? `?ref=${refCode}` : ""}`} className="block mt-auto">
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
                            <span className="fast-tooltip flex items-center gap-1" data-tooltip={`${service.duration || "2 Hours"} duration`}><Clock className="w-3.5 h-3.5" /> {formatDuration(service.duration || "2 Hours")}</span>
                            <span className="fast-tooltip flex items-center gap-1" data-tooltip={service.ageGroup === "All Ages" || !service.ageGroup ? "All ages are welcome." : service.ageGroup}><Users className="w-3.5 h-3.5" /> {service.ageGroup === "All Ages" || !service.ageGroup ? "All" : service.ageGroup}</span>
                            {(service.minPax ?? 0) > 0 && (
                              <span className="fast-tooltip flex items-center gap-1 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-full px-2 py-0.5" data-tooltip={`Minimum ${service.minPax} pax needed.`}>
                                <Users className="w-3 h-3" />{service.minPax}
                              </span>
                            )}
                            {service.photos && service.photos.length > 0 && (
                              <span className="fast-tooltip flex items-center gap-1 text-primary bg-primary/10 px-2 py-0.5 rounded-full" data-tooltip="Click to view Gallery">
                                <Images className="w-3 h-3" />
                                {service.photos.length}
                              </span>
                            )}
                            {(service as any).videoUrl && (
                              <a
                                href={(service as any).videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                data-tooltip={
                                  (service as any).videoUrl.includes("youtube") || (service as any).videoUrl.includes("youtu.be")
                                    ? "Watch on YouTube"
                                    : (service as any).videoUrl.includes("instagram")
                                    ? "Watch on Instagram"
                                    : "Watch Video"
                                }
                                className={`fast-tooltip flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                                  (service as any).videoUrl.includes("youtube") || (service as any).videoUrl.includes("youtu.be")
                                    ? "text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40"
                                    : (service as any).videoUrl.includes("instagram")
                                    ? "text-pink-600 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 hover:bg-pink-100 dark:hover:bg-pink-900/40"
                                    : "text-blue-600 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100"
                                }`}
                              >
                                {(service as any).videoUrl.includes("youtube") || (service as any).videoUrl.includes("youtu.be")
                                  ? <SiYoutube className="w-3.5 h-3.5" />
                                  : (service as any).videoUrl.includes("instagram")
                                  ? <SiInstagram className="w-3.5 h-3.5" />
                                  : <Play className="w-3 h-3" />
                                }
                              </a>
                            )}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>
                );
              })}
              {services?.filter(s => s.isActive !== false)
                .filter(s => selectedCategoryId === null || (s as any).categoryId === selectedCategoryId)
                .filter(s => !searchQuery.trim() || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.description ?? "").toLowerCase().includes(searchQuery.toLowerCase()))
                .length === 0 && (
                  <p className="col-span-full text-center text-muted-foreground py-12" data-testid="text-no-results">
                    No services found. Try a different search or category.
                  </p>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
