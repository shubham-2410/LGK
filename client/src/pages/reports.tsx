import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useServices } from "@/hooks/use-services";
import { AppLayout } from "@/components/layout";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid, startOfMonth, endOfMonth, subDays, addDays } from "date-fns";
import {
  RefreshCw,
  Search,
  X,
  TrendingUp,
  CheckCircle2,
  IndianRupee,
  CalendarDays,
  BarChart2,
  FileDown,
  Maximize2,
  Minimize2,
  Settings2,
  Clock,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type Booking = {
  id: number;
  userId: number | null;
  serviceId: number | null;
  date: string;
  timeSlot: string;
  fullName: string;
  contactNumber: string;
  email: string;
  pax: number;
  totalPayable: number;
  amountPaid: number;
  balance: number;
  status: string;
  cancelReason: string | null;
  couponCode: string | null;
  couponDiscount: number | null;
  referralCode: string | null;
  referralCommission: number | null;
  transactionId: string | null;
  gstAmount: number | null;
  cgstAmount: number | null;
  sgstAmount: number | null;
  settlementAmount: number | null;
  isSettled: boolean | null;
  createdAt: string | null;
};

type Service = {
  id: number;
  name: string;
};

const STATUS_OPTIONS = ["all", "pending", "confirmed", "completed", "cancelled"];

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function fmt(n: number | null | undefined) {
  return n != null ? `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";
}


function parseDate(d: string) {
  if (!d) return null;
  const p = parseISO(d);
  if (isValid(p)) return p;
  const p2 = new Date(d);
  if (isValid(p2)) return p2;
  return null;
}

function ServiceCombobox({
  value,
  onChange,
  services,
}: {
  value: string;
  onChange: (v: string) => void;
  services: Service[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selectedService = services.find((s) => String(s.id) === value);
  const displayText = selectedService ? selectedService.name : "";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = query.trim()
    ? services.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
    : services;

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={ref} className="relative" data-testid="service-combobox">
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl border bg-card text-sm transition-colors",
        open ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-primary/40"
      )}>
        <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground min-w-0"
          placeholder={displayText || "All Services"}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          data-testid="input-service-filter"
        />
        {(value !== "all" || query) && (
          <button
            type="button"
            onClick={() => { handleSelect("all"); setQuery(""); }}
            className="text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-xl border border-border bg-popover shadow-lg overflow-hidden">
          <div className="max-h-52 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => handleSelect("all")}
              className={cn(
                "w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition-colors",
                value === "all" ? "text-primary font-semibold" : "text-foreground"
              )}
            >
              All Services
            </button>
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">No services found</p>
            ) : (
              filtered.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelect(String(s.id))}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition-colors",
                    String(s.id) === value ? "text-primary font-semibold" : "text-foreground"
                  )}
                >
                  {s.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type ShortcutMode = "month" | "7days" | "today" | null;

function ReportDatePicker({
  value,
  onChange,
  label,
  testId,
  shortcuts,
  referenceDate,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  testId: string;
  shortcuts?: { label: string; mode: ShortcutMode }[];
  referenceDate?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeShortcut, setActiveShortcut] = useState<ShortcutMode>(null);
  const ref = useRef<HTMLDivElement>(null);

  const selected = value ? new Date(value + "T00:00:00") : undefined;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const applyShortcut = (mode: ShortcutMode) => {
    setActiveShortcut(mode);
    if (mode === "month") {
      const base = referenceDate ? parseDate(referenceDate) ?? new Date() : new Date();
      onChange(referenceDate
        ? format(endOfMonth(base), "yyyy-MM-dd")
        : format(startOfMonth(base), "yyyy-MM-dd")
      );
    } else if (mode === "7days") {
      const base = referenceDate ? parseDate(referenceDate) ?? new Date() : new Date();
      onChange(referenceDate
        ? format(addDays(base, 7), "yyyy-MM-dd")
        : format(subDays(new Date(), 7), "yyyy-MM-dd")
      );
    }
    else if (mode === "today") onChange(format(new Date(), "yyyy-MM-dd"));
  };

  const defaultShortcuts: { label: string; mode: ShortcutMode }[] = shortcuts ?? [
    { label: "Month", mode: "month" },
    { label: "7 Days", mode: "7days" },
    { label: "Today", mode: "today" },
  ];

  return (
    <div ref={ref} className="relative" data-testid={testId}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border bg-card text-sm transition-colors",
          open ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-primary/40"
        )}
        data-testid={`${testId}-trigger`}
      >
        <CalendarDays className="w-4 h-4 text-primary flex-shrink-0" />
        <span className={cn("flex-1 text-left", selected ? "text-foreground font-medium" : "text-muted-foreground")}>
          {selected ? format(selected, "dd MMM yyyy") : `Select ${label}`}
        </span>
        {selected && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onChange(""); setActiveShortcut(null); }}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
            data-testid={`${testId}-clear`}
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 shadow-2xl rounded-2xl border border-border bg-card overflow-hidden min-w-[280px]">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d) => {
              onChange(d ? format(d, "yyyy-MM-dd") : "");
              setActiveShortcut(null);
              setOpen(false);
            }}
            classNames={{
              months: "flex flex-col",
              month: "space-y-3",
              caption:
                "flex justify-center items-center relative bg-primary text-primary-foreground px-4 pt-3 pb-2 rounded-t-xl",
              caption_label: "text-sm font-bold tracking-wide text-accent",
              nav: "flex items-center",
              nav_button: cn(
                buttonVariants({ variant: "ghost" }),
                "h-7 w-7 p-0 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground rounded-lg opacity-90 hover:opacity-100"
              ),
              nav_button_previous: "absolute left-3",
              nav_button_next: "absolute right-3",
              table: "w-full border-collapse",
              head_row: "flex px-3",
              head_cell:
                "text-muted-foreground rounded-md w-9 font-semibold text-[0.7rem] uppercase",
              row: "flex w-full px-3",
              cell: cn(
                "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                "[&:has([aria-selected])]:bg-primary/10 first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg"
              ),
              day: cn(
                buttonVariants({ variant: "ghost" }),
                "h-9 w-9 p-0 font-medium aria-selected:opacity-100 rounded-lg"
              ),
              day_selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today:
                "bg-accent/20 text-accent font-bold",
              day_outside: "text-muted-foreground/40 aria-selected:bg-primary/5",
              day_disabled: "text-muted-foreground opacity-30",
              day_hidden: "invisible",
            }}
          />

          {/* Shortcut buttons */}
          <div className="px-3 pb-3 pt-1 space-y-2 border-t border-border">
            <div className="grid grid-cols-3 gap-1.5">
              {defaultShortcuts.map((s) => (
                <button
                  key={s.mode}
                  type="button"
                  onClick={() => { applyShortcut(s.mode); setOpen(false); }}
                  className={cn(
                    "text-xs font-semibold py-1.5 px-2 rounded-lg border transition-colors",
                    activeShortcut === s.mode
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                  )}
                  data-testid={`${testId}-shortcut-${s.mode}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => { onChange(format(new Date(), "yyyy-MM-dd")); setActiveShortcut("today"); setOpen(false); }}
                className="text-xs font-semibold py-1.5 px-2 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-colors"
                data-testid={`${testId}-today`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => { onChange(""); setActiveShortcut(null); setOpen(false); }}
                className="text-xs font-semibold py-1.5 px-2 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
                data-testid={`${testId}-clear-btn`}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CSV Column Definitions ─────────────────────────────────────────────────
type CsvColumnKey =
  | "id" | "bookingDate" | "activityDate" | "fullName" | "contactNumber" | "email"
  | "pax" | "service" | "timeSlot" | "amountPaid" | "balance" | "totalPayable"
  | "settlementAmount" | "settlementStatus" | "gstAmount" | "cgstAmount" | "sgstAmount"
  | "couponCode" | "couponDiscount" | "referralCode" | "transactionId" | "status";

const CSV_COLUMNS: { key: CsvColumnKey; label: string }[] = [
  { key: "id", label: "Booking ID" },
  { key: "bookingDate", label: "Booking Date" },
  { key: "activityDate", label: "Activity Date" },
  { key: "fullName", label: "Customer Name" },
  { key: "contactNumber", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "pax", label: "PAX" },
  { key: "service", label: "Service" },
  { key: "timeSlot", label: "Time Slot" },
  { key: "amountPaid", label: "Token Paid" },
  { key: "balance", label: "Balance Due" },
  { key: "totalPayable", label: "Net Amount" },
  { key: "settlementAmount", label: "Settlement Amount" },
  { key: "settlementStatus", label: "Settlement Status" },
  { key: "gstAmount", label: "GST Amount" },
  { key: "cgstAmount", label: "CGST" },
  { key: "sgstAmount", label: "SGST" },
  { key: "couponCode", label: "Coupon Code" },
  { key: "couponDiscount", label: "Coupon Discount" },
  { key: "referralCode", label: "Referral Code" },
  { key: "transactionId", label: "Transaction ID" },
  { key: "status", label: "Status" },
];

const ALL_CSV_COLUMN_KEYS = CSV_COLUMNS.map(c => c.key);
const REPORT_SESSION_KEY = "report_csv_selected_columns";

// ─── Display Column Visibility ───────────────────────────────────────────────
type ColKey = "date" | "customer" | "phone" | "pax" | "service" | "time"
  | "token" | "balance" | "net" | "gst" | "cgst" | "sgst"
  | "coupon" | "discount" | "referral" | "txn" | "status";

const ALL_DISPLAY_COLS: { key: ColKey; label: string }[] = [
  { key: "date",       label: "Date" },
  { key: "customer",   label: "Customer" },
  { key: "phone",      label: "Phone" },
  { key: "pax",        label: "PAX" },
  { key: "service",    label: "Service" },
  { key: "time",       label: "Time" },
  { key: "token",      label: "Token Paid" },
  { key: "balance",    label: "Balance" },
  { key: "net",        label: "Net Amt" },
  { key: "gst",        label: "GST" },
  { key: "cgst",       label: "CGST" },
  { key: "sgst",       label: "SGST" },
  { key: "coupon",     label: "Coupon" },
  { key: "discount",   label: "Discount" },
  { key: "referral",   label: "Referral" },
  { key: "txn",        label: "Txn ID" },
  { key: "status",     label: "Status" },
];
const DEFAULT_DISPLAY_COLS: ColKey[] = ["date", "service", "token", "balance", "net"];
const COL_VIS_KEY = "report_col_visibility";

function loadColVisibility(): ColKey[] {
  try {
    const stored = localStorage.getItem(COL_VIS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as string[];
      const valid = parsed.filter(k => ALL_DISPLAY_COLS.some(c => c.key === k)) as ColKey[];
      if (valid.length > 0) return valid;
    }
  } catch {}
  return [...DEFAULT_DISPLAY_COLS];
}

function loadReportColumns(): CsvColumnKey[] {
  try {
    const stored = sessionStorage.getItem(REPORT_SESSION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as string[];
      const valid = parsed.filter(k => ALL_CSV_COLUMN_KEYS.includes(k as CsvColumnKey)) as CsvColumnKey[];
      if (valid.length > 0) return valid;
    }
  } catch {}
  return [...ALL_CSV_COLUMN_KEYS];
}

type SettlementFilter = "all" | "settled" | "unsettled";

function ReportCsvColumnPickerModal({
  selected,
  onChange,
  onExport,
  onClose,
}: {
  selected: CsvColumnKey[];
  onChange: (cols: CsvColumnKey[]) => void;
  onExport: (cols: CsvColumnKey[], settlementFilter: SettlementFilter) => void;
  onClose: () => void;
}) {
  const [localSelected, setLocalSelected] = useState<CsvColumnKey[]>(selected);
  const [settlementFilter, setSettlementFilter] = useState<SettlementFilter>("all");

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const toggle = (key: CsvColumnKey) =>
    setLocalSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  const selectAll = () => setLocalSelected([...ALL_CSV_COLUMN_KEYS]);
  const selectNone = () => setLocalSelected([]);

  const handleExport = () => {
    onChange(localSelected);
    onExport(localSelected, settlementFilter);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in pb-20 sm:pb-0"
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border mx-0 sm:mx-4 animate-in slide-in-from-bottom-4 flex flex-col"
        style={{ maxHeight: "min(90dvh, 90vh)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-border">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl p-2.5">
              <FileDown className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground">Export CSV</h2>
              <p className="text-sm text-muted-foreground">Choose columns to include</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={selectAll} className="text-xs font-semibold text-primary hover:underline" data-testid="button-csv-select-all">Select all</button>
            <span className="text-muted-foreground text-xs">·</span>
            <button onClick={selectNone} className="text-xs font-semibold text-muted-foreground hover:underline" data-testid="button-csv-select-none">Deselect all</button>
          </div>
          {/* Settlement filter */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Settlement status</p>
            <div className="flex gap-1 bg-muted rounded-xl p-1">
              {(["all", "settled", "unsettled"] as SettlementFilter[]).map(opt => (
                <button
                  key={opt}
                  onClick={() => setSettlementFilter(opt)}
                  data-testid={`csv-settlement-filter-${opt}`}
                  className={cn(
                    "flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors capitalize",
                    settlementFilter === opt
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt === "all" ? "All" : opt === "settled" ? "Settled" : "Unsettled"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-3 min-h-0">
          <div className="space-y-1">
            {CSV_COLUMNS.map(col => {
              const checked = localSelected.includes(col.key);
              return (
                <button
                  key={col.key}
                  onClick={() => toggle(col.key)}
                  data-testid={`csv-col-toggle-${col.key}`}
                  className={`w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    checked
                      ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300"
                      : "border-border bg-background hover:bg-muted text-foreground"
                  }`}
                >
                  <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    checked ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground/40"
                  }`}>
                    {checked && (
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  {col.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="px-6 py-4 flex-shrink-0 border-t border-border bg-card rounded-b-3xl sm:rounded-b-3xl">
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose} data-testid="button-csv-picker-cancel">Cancel</Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={localSelected.length === 0}
              onClick={handleExport}
              data-testid="button-csv-picker-export"
            >
              <FileDown className="w-4 h-4 mr-1.5" />
              Export {localSelected.length > 0 ? `(${localSelected.length})` : ""}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function useIsMobile() {
  return typeof window !== "undefined" && window.innerWidth < 768;
}

export default function Reports() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [toDate, setToDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [fromDate, setFromDate] = useState(() => format(subDays(new Date(), 7), "yyyy-MM-dd"));
  const [serviceFilter, setServiceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [settlementInputs, setSettlementInputs] = useState<Record<number, string>>({});
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [selectedCsvColumns, setSelectedCsvColumns] = useState<CsvColumnKey[]>(loadReportColumns);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortField, setSortField] = useState<"date" | "service" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [visibleCols, setVisibleCols] = useState<ColKey[]>(loadColVisibility);
  const [showColPicker, setShowColPicker] = useState(false);
  const [colPickerPos, setColPickerPos] = useState<{ top: number; right: number } | null>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const colPickerRef = useRef<HTMLDivElement>(null);
  const colPickerBtnRef = useRef<HTMLButtonElement>(null);

  const show = (key: ColKey) => visibleCols.includes(key);

  const toggleCol = (key: ColKey) => {
    setVisibleCols(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      try { localStorage.setItem(COL_VIS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  useEffect(() => {
    if (!showColPicker) return;
    const handler = (e: MouseEvent) => {
      if (colPickerRef.current && !colPickerRef.current.contains(e.target as Node)) {
        setShowColPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showColPicker]);

  const toggleSort = (field: "date" | "service") => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  useEffect(() => {
    if (!isExpanded) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setIsExpanded(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isExpanded]);

  const getCsvCellValue = (b: Booking & { serviceName: string }, key: CsvColumnKey): string | number => {
    switch (key) {
      case "id": return b.id;
      case "bookingDate": return b.createdAt ? format(parseDate(b.createdAt) ?? new Date(), "dd-MMM-yyyy") : "";
      case "activityDate": return b.date ? format(parseDate(b.date) ?? new Date(), "dd-MMM-yyyy") : b.date;
      case "fullName": return b.fullName;
      case "contactNumber": return b.contactNumber;
      case "email": return b.email;
      case "pax": return b.pax;
      case "service": return b.serviceName;
      case "timeSlot": return b.timeSlot;
      case "amountPaid": return b.amountPaid;
      case "balance": return b.balance;
      case "totalPayable": return b.totalPayable;
      case "settlementAmount": return b.settlementAmount ?? b.totalPayable;
      case "settlementStatus": return b.isSettled ? "Settled" : "Pending";
      case "gstAmount": return b.gstAmount ?? 0;
      case "cgstAmount": return b.cgstAmount ?? 0;
      case "sgstAmount": return b.sgstAmount ?? 0;
      case "couponCode": return b.couponCode ?? "";
      case "couponDiscount": return b.couponDiscount ?? 0;
      case "referralCode": return b.referralCode ?? "";
      case "transactionId": return b.transactionId ?? "";
      case "status": return b.status;
    }
  };

  const handleExportCsv = (cols: CsvColumnKey[], settlementFilter: SettlementFilter) => {
    const effectiveCols = cols.length > 0 ? cols : [...ALL_CSV_COLUMN_KEYS];
    const headers = effectiveCols.map(k => CSV_COLUMNS.find(c => c.key === k)!.label);
    const exportRows = filtered.filter(b => {
      if (settlementFilter === "settled") return b.isSettled === true;
      if (settlementFilter === "unsettled") return b.isSettled !== true;
      return true;
    });
    const rows = exportRows.map(b => effectiveCols.map(k => `"${String(getCsvCellValue(b, k)).replace(/"/g, '""')}"`));
    const suffix = settlementFilter !== "all" ? `-${settlementFilter}` : "";
    const csv = [headers.map(h => `"${h}"`).join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `booking-report-${format(new Date(), "yyyy-MM-dd")}${suffix}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const { data: accountHeads = [] } = useQuery<{ id: number; name: string; type: string; bookingMapping: string }[]>({
    queryKey: ["/api/account-heads"],
  });

  const hasAutoReceiveAccount = accountHeads.some(
    h => (h.type === "bank" || h.type === "cash") && (h.bookingMapping === "balance" || h.bookingMapping === "both")
  );

  const settlementMutation = useMutation({
    mutationFn: ({ id, settlementAmount, isSettled }: { id: number; settlementAmount: number | null; isSettled: boolean }) =>
      apiRequest("PATCH", `/api/bookings/${id}/settlement`, { settlementAmount, isSettled }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ledger-entries"] });
      if (vars.isSettled && (vars.settlementAmount ?? 0) > 0 && !hasAutoReceiveAccount) {
        toast({
          title: "Settlement saved — Ledger not updated",
          description: "No bank/cash account is configured to auto-receive. Go to Accounting → Account Heads and set Booking Mapping to 'Balance only' or 'Both' on your bank or cash account.",
          variant: "destructive",
          duration: 8000,
        });
      }
    },
  });

  const {
    data: bookings = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    enabled: !!user?.isAdmin,
  });

  const { data: services = [] } = useServices();

  const isMobile = useIsMobile();

  if (!user?.isAdmin) {
    navigate("/");
    return null;
  }

  if (isMobile) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
          <BarChart2 className="w-12 h-12 text-muted-foreground opacity-40" />
          <h2 className="text-lg font-semibold text-foreground">Desktop Only</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Booking Reports are available on tablet or desktop screens. Please open this page on a wider device.
          </p>
        </div>
      </AppLayout>
    );
  }

  const serviceMap = useMemo(() => {
    const m: Record<number, string> = {};
    services.forEach((s: Service) => { m[s.id] = s.name; });
    return m;
  }, [services]);

  const enriched = useMemo(
    () =>
      bookings.map((b) => ({
        ...b,
        serviceName: b.serviceId ? (serviceMap[b.serviceId] ?? "—") : "—",
      })),
    [bookings, serviceMap]
  );

  const filtered = useMemo(() => {
    let rows = enriched;
    if (fromDate) {
      const from = parseDate(fromDate);
      if (from) rows = rows.filter((b) => { const d = parseDate(b.date); return d && d >= from; });
    }
    if (toDate) {
      const to = parseDate(toDate);
      if (to) rows = rows.filter((b) => { const d = parseDate(b.date); return d && d <= to; });
    }
    if (serviceFilter !== "all") {
      rows = rows.filter((b) => String(b.serviceId) === serviceFilter);
    }
    if (statusFilter !== "all") {
      rows = rows.filter((b) => b.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (b) =>
          b.fullName.toLowerCase().includes(q) ||
          b.contactNumber.toLowerCase().includes(q) ||
          b.email.toLowerCase().includes(q) ||
          b.serviceName.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [enriched, fromDate, toDate, serviceFilter, statusFilter, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (!sortField) return b.id - a.id;
      let cmp = 0;
      if (sortField === "date") {
        const da = parseDate(a.date)?.getTime() ?? 0;
        const db = parseDate(b.date)?.getTime() ?? 0;
        cmp = da - db;
      } else if (sortField === "service") {
        cmp = a.serviceName.localeCompare(b.serviceName);
      }
      if (cmp === 0) cmp = b.id - a.id;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  useEffect(() => {
    const el = tableScrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [sorted]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const pendingCount = filtered.filter((b) => !b.isSettled).length;
    const tokenCollection = filtered.reduce((s, b) => s + b.amountPaid, 0);
    const totalBalance = filtered.reduce((s, b) => s + (b.balance ?? 0), 0);
    const totalGst = filtered.reduce((s, b) => s + (b.gstAmount ?? 0), 0);
    const totalNet = filtered.reduce((s, b) => s + b.totalPayable, 0);
    const totalCollection = totalNet + totalGst;
    return { total, pendingCount, tokenCollection, totalBalance, totalGst, totalNet, totalCollection };
  }, [filtered]);

  const resetFilters = () => {
    setToDate(format(new Date(), "yyyy-MM-dd"));
    setFromDate(format(subDays(new Date(), 7), "yyyy-MM-dd"));
    setServiceFilter("all");
    setStatusFilter("all");
    setSearch("");
  };

  return (
    <AppLayout>
    <div
      className={isExpanded ? "fixed inset-0 z-[100] bg-background overflow-auto p-6 space-y-5" : "p-6 space-y-5"}
      data-testid="reports-page"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <BarChart2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground leading-tight">Booking Reports</h1>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={() => setShowCsvModal(true)}
            disabled={filtered.length === 0}
            className="rounded-xl gap-1.5"
            data-testid="button-export-csv"
          >
            <FileDown className="w-4 h-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-xl gap-1.5"
            data-testid="button-refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(v => !v)}
            className="rounded-xl gap-1.5"
            data-testid="button-expand-report"
            title={isExpanded ? "Collapse (Esc)" : "Expand to full screen"}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            {isExpanded ? "Collapse" : "Expand"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-border bg-card p-4" data-testid="filters-section">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">From Date</Label>
            <ReportDatePicker
              value={fromDate}
              onChange={setFromDate}
              label="from date"
              testId="picker-from-date"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">To Date</Label>
            <ReportDatePicker
              value={toDate}
              onChange={setToDate}
              label="to date"
              testId="picker-to-date"
              referenceDate={fromDate}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Service</Label>
            <ServiceCombobox
              value={serviceFilter}
              onChange={setServiceFilter}
              services={services}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="rounded-xl" data-testid="select-status-filter">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end pb-0.5">
            <Button
              variant="outline"
              className="w-full rounded-xl border-border hover:border-primary/40 hover:text-primary"
              onClick={resetFilters}
              data-testid="button-reset-filters"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by customer name, phone, email or service…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-xl"
          data-testid="input-search"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex gap-3 overflow-x-auto pb-0.5 no-scrollbar">
        <div className="flex flex-col items-start gap-0.5 text-foreground bg-muted/50 rounded-xl px-4 py-2.5 flex-1 min-w-[80px]" data-testid="stat-total">
          <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground"><CalendarDays className="w-3 h-3" />Bookings</span>
          <span className="text-sm font-bold">{stats.total}</span>
        </div>
        <div className="flex flex-col items-start gap-0.5 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded-xl px-4 py-2.5 flex-1 min-w-[80px]" data-testid="stat-pending">
          <span className="flex items-center gap-1 text-[10px] font-medium opacity-70"><Clock className="w-3 h-3" />Settlement</span>
          <span className="text-sm font-bold">{stats.pendingCount}</span>
        </div>
        <div className="flex flex-col items-start gap-0.5 text-primary bg-primary/10 rounded-xl px-4 py-2.5 flex-1 min-w-[100px]" data-testid="stat-token">
          <span className="flex items-center gap-1 text-[10px] font-medium opacity-70"><IndianRupee className="w-3 h-3" />Token</span>
          <span className="text-sm font-bold">₹{stats.tokenCollection.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex flex-col items-start gap-0.5 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-xl px-4 py-2.5 flex-1 min-w-[100px]" data-testid="stat-balance">
          <span className="flex items-center gap-1 text-[10px] font-medium opacity-70"><TrendingUp className="w-3 h-3" />Balance</span>
          <span className="text-sm font-bold">₹{stats.totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex flex-col items-start gap-0.5 text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 rounded-xl px-4 py-2.5 flex-1 min-w-[100px]" data-testid="stat-gst">
          <span className="flex items-center gap-1 text-[10px] font-medium opacity-70"><IndianRupee className="w-3 h-3" />GST</span>
          <span className="text-sm font-bold">₹{stats.totalGst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex flex-col items-start gap-0.5 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-4 py-2.5 flex-1 min-w-[100px]" data-testid="stat-net">
          <span className="flex items-center gap-1 text-[10px] font-medium opacity-70"><TrendingUp className="w-3 h-3" />Net Amt</span>
          <span className="text-sm font-bold">₹{stats.totalNet.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex flex-col items-start gap-0.5 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-4 py-2.5 flex-1 min-w-[100px]" data-testid="stat-collection">
          <span className="flex items-center gap-1 text-[10px] font-medium opacity-70"><CheckCircle2 className="w-3 h-3" />Collection</span>
          <span className="text-sm font-bold">₹{stats.totalCollection.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No bookings found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto" ref={tableScrollRef}>
            <table className="w-full text-sm" data-testid="report-table">
              <thead>
                <tr className="bg-primary">
                  {/* Always: ID */}
                  <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider whitespace-nowrap text-primary-foreground/70">ID</th>
                  {/* Toggleable columns */}
                  {show("date") && (
                    <th onClick={() => toggleSort("date")} className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider whitespace-nowrap text-accent cursor-pointer select-none hover:opacity-80">
                      <span className="inline-flex items-center gap-1">Date<span className="inline-flex flex-col leading-none"><span className={cn("text-[8px] leading-none", sortField==="date"&&sortDir==="asc"?"opacity-100":"opacity-40")}>▲</span><span className={cn("text-[8px] leading-none", sortField==="date"&&sortDir==="desc"?"opacity-100":"opacity-40")}>▼</span></span></span>
                    </th>
                  )}
                  {show("customer") && <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider whitespace-nowrap text-accent">Customer</th>}
                  {show("phone") && <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider whitespace-nowrap text-primary-foreground/70">Phone</th>}
                  {show("pax") && <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider whitespace-nowrap text-accent">PAX</th>}
                  {show("service") && (
                    <th onClick={() => toggleSort("service")} className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider whitespace-nowrap text-accent cursor-pointer select-none hover:opacity-80">
                      <span className="inline-flex items-center gap-1">Service<span className="inline-flex flex-col leading-none"><span className={cn("text-[8px] leading-none", sortField==="service"&&sortDir==="asc"?"opacity-100":"opacity-40")}>▲</span><span className={cn("text-[8px] leading-none", sortField==="service"&&sortDir==="desc"?"opacity-100":"opacity-40")}>▼</span></span></span>
                    </th>
                  )}
                  {show("time") && <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider whitespace-nowrap text-primary-foreground/70">Time</th>}
                  {show("token") && <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider whitespace-nowrap text-accent">Token Paid</th>}
                  {show("balance") && <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider whitespace-nowrap text-accent">Balance</th>}
                  {show("net") && <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider whitespace-nowrap text-accent">Net Amt</th>}
                  {show("gst") && <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider whitespace-nowrap text-primary-foreground/70">GST</th>}
                  {show("cgst") && <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider whitespace-nowrap text-primary-foreground/70">CGST</th>}
                  {show("sgst") && <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider whitespace-nowrap text-primary-foreground/70">SGST</th>}
                  {show("coupon") && <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider whitespace-nowrap text-primary-foreground/70">Coupon</th>}
                  {show("discount") && <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider whitespace-nowrap text-primary-foreground/70">Discount</th>}
                  {show("referral") && <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider whitespace-nowrap text-primary-foreground/70">Referral</th>}
                  {show("txn") && <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider whitespace-nowrap text-primary-foreground/70">Txn ID</th>}
                  {show("status") && <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider whitespace-nowrap text-accent">Status</th>}
                  {/* Always: Settlement */}
                  <th className="text-left px-3 py-3 font-bold text-xs uppercase tracking-wider whitespace-nowrap text-accent">Settlement</th>
                  {/* Always: Action + gear icon inline */}
                  <th className="pl-3 pr-1 py-3 font-bold text-xs uppercase tracking-wider whitespace-nowrap text-accent w-px">
                    <div className="flex items-center gap-1.5">
                      <span>Action</span>
                      <div ref={colPickerRef}>
                        <button
                          ref={colPickerBtnRef}
                          onClick={() => {
                            if (!showColPicker && colPickerBtnRef.current) {
                              const rect = colPickerBtnRef.current.getBoundingClientRect();
                              setColPickerPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                            }
                            setShowColPicker(v => !v);
                          }}
                          data-testid="button-col-config"
                          title="Configure visible columns"
                          className={cn(
                            "w-5 h-5 rounded flex items-center justify-center transition-colors",
                            showColPicker
                              ? "bg-white/20 text-white"
                              : "text-primary-foreground/50 hover:text-white hover:bg-white/10"
                          )}
                        >
                          <Settings2 className="w-3 h-3" />
                        </button>
                        {showColPicker && colPickerPos && (
                          <div
                            style={{ position: "fixed", top: colPickerPos.top, right: colPickerPos.right }}
                            className="z-[9999] w-52 bg-popover border border-border rounded-xl shadow-xl p-2 animate-in fade-in slide-in-from-top-2 max-h-[70vh] overflow-y-auto"
                          >
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 pb-1.5">Show columns</p>
                            <div className="space-y-0.5">
                              {ALL_DISPLAY_COLS.map(col => {
                                const checked = visibleCols.includes(col.key);
                                return (
                                  <button
                                    key={col.key}
                                    onClick={() => toggleCol(col.key)}
                                    data-testid={`col-toggle-${col.key}`}
                                    className={cn(
                                      "w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                      checked ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                  >
                                    <span className={cn("w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center", checked ? "bg-primary border-primary" : "border-muted-foreground/30")}>
                                      {checked && <svg className="w-2 h-2 text-white" viewBox="0 0 8 8"><path d="M1 4l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
                                    </span>
                                    {col.label}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="border-t border-border mt-2 pt-1.5 flex gap-1 px-1">
                              <button onClick={() => { const all = ALL_DISPLAY_COLS.map(c=>c.key); setVisibleCols(all); try { localStorage.setItem(COL_VIS_KEY, JSON.stringify(all)); } catch {} }} className="flex-1 text-[10px] font-semibold text-primary hover:underline text-center">All</button>
                              <span className="text-muted-foreground text-[10px]">·</span>
                              <button onClick={() => { setVisibleCols([...DEFAULT_DISPLAY_COLS]); try { localStorage.setItem(COL_VIS_KEY, JSON.stringify(DEFAULT_DISPLAY_COLS)); } catch {} }} className="flex-1 text-[10px] font-semibold text-muted-foreground hover:underline text-center">Default</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((b, idx) => {
                  const activityDate = b.date
                    ? (() => { const d = parseDate(b.date); return d ? format(d, "dd-MMM-yy") : b.date; })()
                    : "—";
                  const settled = !!b.isSettled;
                  const defaultAmt = b.totalPayable;
                  const inputVal = settlementInputs[b.id] ?? (b.settlementAmount != null ? String(b.settlementAmount) : String(defaultAmt));
                  const isSaving = settlementMutation.isPending && (settlementMutation.variables as any)?.id === b.id;

                  const isCancelledZero = b.status === "cancelled" && parseInt(inputVal) === 0;

                  // When settled, adjust Net and Balance to reflect the actual settled amount
                  const displayNet = (settled && b.settlementAmount != null) ? b.settlementAmount : b.totalPayable;
                  const displayBalance = (settled && b.settlementAmount != null)
                    ? Math.max(0, b.settlementAmount - b.amountPaid)
                    : b.balance;

                  const handleToggleSettlement = () => {
                    const amt = parseInt(inputVal) || 0;
                    settlementMutation.mutate({ id: b.id, settlementAmount: amt, isSettled: !settled });
                  };

                  return (
                    <tr
                      key={b.id}
                      data-testid={`row-booking-${b.id}`}
                      className={cn(
                        "border-b border-border last:border-0 transition-colors",
                        settled
                          ? "bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/30"
                          : idx % 2 === 0 ? "hover:bg-muted/30" : "bg-muted/10 hover:bg-muted/30"
                      )}
                    >
                      {/* Always: ID */}
                      <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap" data-testid={`cell-id-${b.id}`}># {b.id}</td>
                      {/* Toggleable cells */}
                      {show("date") && <td className="px-3 py-2.5 whitespace-nowrap font-medium" data-testid={`cell-date-${b.id}`}>{activityDate}</td>}
                      {show("customer") && <td className="px-3 py-2.5 whitespace-nowrap max-w-[140px] truncate font-medium" title={b.fullName} data-testid={`cell-name-${b.id}`}>{b.fullName}</td>}
                      {show("phone") && <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground" data-testid={`cell-phone-${b.id}`}>{b.contactNumber}</td>}
                      {show("pax") && <td className="px-3 py-2.5 text-center font-semibold" data-testid={`cell-pax-${b.id}`}>{b.pax}</td>}
                      {show("service") && <td className="px-3 py-2.5 whitespace-nowrap max-w-[120px] truncate" title={b.serviceName} data-testid={`cell-service-${b.id}`}>{b.serviceName}</td>}
                      {show("time") && <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground text-xs" data-testid={`cell-time-${b.id}`}>{b.timeSlot}</td>}
                      {show("token") && (
                        <td className={`px-3 py-2.5 whitespace-nowrap font-semibold ${isCancelledZero ? "text-muted-foreground line-through" : "text-emerald-700 dark:text-emerald-400"}`} data-testid={`cell-token-${b.id}`}>
                          {isCancelledZero ? "₹0" : fmt(b.amountPaid)}
                        </td>
                      )}
                      {show("balance") && (
                        <td className={`px-3 py-2.5 whitespace-nowrap font-semibold ${isCancelledZero ? "text-muted-foreground line-through" : displayBalance > 0 ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"}`} data-testid={`cell-balance-${b.id}`}>
                          {isCancelledZero ? "₹0" : displayBalance > 0 ? fmt(displayBalance) : "NIL"}
                        </td>
                      )}
                      {show("net") && (
                        <td className={`px-3 py-2.5 whitespace-nowrap font-bold ${isCancelledZero ? "text-muted-foreground line-through" : "text-foreground"}`} data-testid={`cell-net-${b.id}`}>
                          {isCancelledZero ? "₹0" : fmt(displayNet)}
                        </td>
                      )}
                      {show("gst") && <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground" data-testid={`cell-gst-${b.id}`}>{b.gstAmount ? fmt(b.gstAmount) : "—"}</td>}
                      {show("cgst") && <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground" data-testid={`cell-cgst-${b.id}`}>{b.cgstAmount ? fmt(b.cgstAmount) : "—"}</td>}
                      {show("sgst") && <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground" data-testid={`cell-sgst-${b.id}`}>{b.sgstAmount ? fmt(b.sgstAmount) : "—"}</td>}
                      {show("coupon") && <td className="px-3 py-2.5 whitespace-nowrap font-mono text-xs" data-testid={`cell-coupon-${b.id}`}>{b.couponCode ?? "—"}</td>}
                      {show("discount") && <td className="px-3 py-2.5 whitespace-nowrap text-emerald-700 dark:text-emerald-400" data-testid={`cell-discount-${b.id}`}>{b.couponDiscount ? `−₹${b.couponDiscount}` : "—"}</td>}
                      {show("referral") && <td className="px-3 py-2.5 whitespace-nowrap font-mono text-xs text-muted-foreground" data-testid={`cell-referral-${b.id}`}>{b.referralCode ?? "—"}</td>}
                      {show("txn") && <td className="px-3 py-2.5 whitespace-nowrap font-mono text-xs text-muted-foreground max-w-[80px] truncate" title={b.transactionId ?? ""} data-testid={`cell-txn-${b.id}`}>{b.transactionId ?? "—"}</td>}
                      {show("status") && (
                        <td className="px-3 py-2.5 whitespace-nowrap" data-testid={`cell-status-${b.id}`}>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[b.status] ?? "bg-muted text-muted-foreground"}`}>
                            {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                          </span>
                        </td>
                      )}
                      {/* Always: Settlement */}
                      <td className="px-3 py-2.5 whitespace-nowrap" data-testid={`cell-settlement-${b.id}`}>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground font-medium">₹</span>
                          <input
                            type="number"
                            min="0"
                            value={inputVal}
                            onChange={(e) => setSettlementInputs((prev) => ({ ...prev, [b.id]: e.target.value }))}
                            disabled={(b.status !== "completed" && b.status !== "cancelled") || settled}
                            className="w-20 h-7 text-sm font-semibold bg-transparent border border-border rounded-lg px-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                            data-testid={`input-settlement-${b.id}`}
                          />
                        </div>
                      </td>
                      {/* Always: Action */}
                      <td className="pl-3 pr-1 py-2.5 whitespace-nowrap w-px" data-testid={`cell-action-${b.id}`}>
                        <button
                          onClick={handleToggleSettlement}
                          disabled={isSaving || (b.status !== "completed" && b.status !== "cancelled")}
                          title={b.status !== "completed" && b.status !== "cancelled" ? "Only available for completed or cancelled bookings" : undefined}
                          data-testid={`button-settle-${b.id}`}
                          className={cn(
                            "text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed",
                            settled
                              ? "bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60"
                              : "bg-card border-border text-muted-foreground hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                          )}
                        >
                          {isSaving ? "…" : settled ? "Unsettle" : "Settle"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCsvModal && (
        <ReportCsvColumnPickerModal
          selected={selectedCsvColumns}
          onChange={cols => {
            setSelectedCsvColumns(cols);
            try { sessionStorage.setItem(REPORT_SESSION_KEY, JSON.stringify(cols)); } catch {}
          }}
          onExport={handleExportCsv}
          onClose={() => setShowCsvModal(false)}
        />
      )}
    </div>
    </AppLayout>
  );
}
