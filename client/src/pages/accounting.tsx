import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  BookOpen, Building2, Plus, Pencil, Trash2, X,
  CreditCard, TrendingDown, TrendingUp, ArrowLeftRight,
  ChevronDown, ChevronUp, Search, Wallet, Landmark, RefreshCw, FileDown,
} from "lucide-react";
import type { AccountHead, LedgerEntry } from "@shared/schema";

// ─── Types & Helpers ─────────────────────────────────────────────────────────

type AccountType = "creditor" | "debtor" | "bank" | "cash";
type EntryType = "payable" | "receivable" | "adjustment";

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  creditor: "Creditor / Accounts Payable",
  debtor: "Debtor / Accounts Receivable",
  bank: "Bank Account",
  cash: "Cash in Hand",
};

const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  creditor: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  debtor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  bank: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  cash: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const ACCOUNT_TYPE_ICONS: Record<AccountType, JSX.Element> = {
  creditor: <TrendingDown className="w-3.5 h-3.5" />,
  debtor: <TrendingUp className="w-3.5 h-3.5" />,
  bank: <Landmark className="w-3.5 h-3.5" />,
  cash: <Wallet className="w-3.5 h-3.5" />,
};

function fmt(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function today() {
  return format(new Date(), "yyyy-MM-dd");
}

// ─── Account Head Form Modal ─────────────────────────────────────────────────

type BookingMapping = "none" | "token" | "balance" | "both" | "net";

const BOOKING_MAPPING_OPTIONS: { value: BookingMapping; label: string; desc: string }[] = [
  { value: "none",    label: "None",         desc: "No auto-entry on booking events" },
  { value: "token",   label: "Token only",   desc: "Auto-record token (advance) amount on confirmation" },
  { value: "balance", label: "Balance only", desc: "Auto-record balance due amount on settlement" },
  { value: "net",     label: "Net Amount",   desc: "Auto-record full net amount on confirmation" },
];

function AccountHeadModal({
  initial,
  allAccountHeads = [],
  currentBalance,
  onClose,
  onSave,
}: {
  initial?: AccountHead;
  allAccountHeads?: AccountHead[];
  currentBalance?: number;
  onClose: () => void;
  onSave: (data: Omit<AccountHead, "id" | "createdAt">) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<AccountType>((initial?.type as AccountType) ?? "creditor");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [place, setPlace] = useState(initial?.place ?? "");
  const [openingBalance, setOpeningBalance] = useState(String(initial?.openingBalance ?? 0));
  const [bookingMapping, setBookingMapping] = useState<BookingMapping>((initial?.bookingMapping as BookingMapping) ?? "none");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // ledgerContribution = sum of all entry effects (totalRec - totalPay - adjOut + adjIn)
  // currentBalance = openingBalance + ledgerContribution
  const ledgerContribution = initial
    ? (currentBalance ?? initial.openingBalance ?? 0) - (initial.openingBalance ?? 0)
    : 0;

  // Derived: the current balance based on the opening balance the user has typed
  const computedCurrentBalance = (parseInt(openingBalance) || 0) + ledgerContribution;

  const handleCurrentBalanceChange = (val: string) => {
    const newCurBal = parseInt(val) || 0;
    setOpeningBalance(String(newCurBal - ledgerContribution));
  };

  // Mapping strategies are mutually exclusive across accounts.
  // If any other account uses the split strategy (token/balance/both), disable net here,
  // and vice-versa: if any other account uses net, disable token and balance.
  const otherMappings = allAccountHeads
    .filter(h => h.id !== initial?.id)
    .map(h => (h as any).bookingMapping ?? "none");

  const netDisabled   = otherMappings.some(m => ["token", "balance", "both"].includes(m));
  const splitDisabled = otherMappings.some(m => ["net", "both"].includes(m));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast({ title: "Account name is required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      await onSave({ name: name.trim(), type, address, place, openingBalance: parseInt(openingBalance) || 0, bookingMapping });
      onClose();
    } catch {
      toast({ title: "Failed to save account", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in pb-16 sm:pb-0" onClick={onClose}>
      <div className="bg-card w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border mx-0 sm:mx-4 animate-in slide-in-from-bottom-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-2xl p-2.5">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-bold text-lg text-foreground">{initial ? "Edit Account Head" : "New Account Head"}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Account Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Salary Account, Petrol Expense"
              data-testid="input-account-name"
              className="w-full h-10 border border-border rounded-xl px-3 text-sm bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Account Type *</label>
            <div className="grid grid-cols-2 gap-2">
              {(["creditor", "debtor", "bank", "cash"] as AccountType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  data-testid={`btn-type-${t}`}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left",
                    type === t
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  )}
                >
                  <span className={cn("w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0", ACCOUNT_TYPE_COLORS[t])}>
                    {ACCOUNT_TYPE_ICONS[t]}
                  </span>
                  <span className="text-xs leading-tight">{ACCOUNT_TYPE_LABELS[t]}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Booking auto-map — only for bank / cash accounts */}
          {(type === "bank" || type === "cash") && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Booking Auto-Map
              </label>
              <p className="text-xs text-muted-foreground mb-2">When a booking is confirmed, automatically record the selected amount into this account.</p>
              <div className="grid grid-cols-2 gap-2">
                {BOOKING_MAPPING_OPTIONS.map(opt => {
                  const isDisabled =
                    (opt.value === "net" && netDisabled) ||
                    (["token", "balance"].includes(opt.value) && splitDisabled);
                  const disabledReason =
                    opt.value === "net" && netDisabled
                      ? "Unavailable — another account already uses Token or Balance mapping"
                      : ["token", "balance"].includes(opt.value) && splitDisabled
                        ? "Unavailable — another account already uses Net Amount mapping"
                        : undefined;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => !isDisabled && setBookingMapping(opt.value)}
                      data-testid={`btn-mapping-${opt.value}`}
                      title={disabledReason}
                      className={cn(
                        "flex flex-col items-start px-3 py-2.5 rounded-xl border text-left text-sm font-medium transition-all",
                        isDisabled
                          ? "border-border bg-muted text-muted-foreground opacity-40 cursor-not-allowed"
                          : bookingMapping === opt.value
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <span className="font-semibold text-xs">{opt.label}</span>
                      <span className="text-[10px] leading-tight mt-0.5 opacity-70">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Address</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Street / Area"
                data-testid="input-account-address"
                className="w-full h-10 border border-border rounded-xl px-3 text-sm bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Place</label>
              <input
                type="text"
                value={place}
                onChange={e => setPlace(e.target.value)}
                placeholder="City / Town"
                data-testid="input-account-place"
                className="w-full h-10 border border-border rounded-xl px-3 text-sm bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>
          {initial && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Current Balance (₹)
              </label>
              <input
                type="number"
                value={computedCurrentBalance}
                onChange={e => handleCurrentBalanceChange(e.target.value)}
                data-testid="input-current-balance"
                className="w-full h-10 border border-primary rounded-xl px-3 text-sm bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 font-semibold"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Editing this adjusts the opening balance so the ledger reflects the value you enter.
              </p>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Opening Balance (₹) {initial && <span className="text-[10px] font-normal normal-case ml-1">— auto-updated when you change Current Balance above</span>}
            </label>
            <input
              type="number"
              value={openingBalance}
              onChange={e => setOpeningBalance(e.target.value)}
              data-testid="input-opening-balance"
              className="w-full h-10 border border-border rounded-xl px-3 text-sm bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saving} data-testid="btn-save-account">
              {saving ? "Saving…" : initial ? "Update Account" : "Create Account"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Account Combobox ─────────────────────────────────────────────────────────

function AccountCombobox({
  accounts,
  value,
  onChange,
  placeholder = "Search account…",
  testId,
}: {
  accounts: AccountHead[];
  value: number | "";
  onChange: (id: number | "") => void;
  placeholder?: string;
  testId?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = accounts.find(a => a.id === value);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return accounts;
    return accounts.filter(a =>
      a.name.toLowerCase().includes(q) ||
      ACCOUNT_TYPE_LABELS[a.type as AccountType].toLowerCase().includes(q)
    );
  }, [accounts, query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (id: number) => {
    onChange(id);
    setQuery("");
    setOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setQuery("");
  };

  return (
    <div ref={ref} className="relative">
      <div className={cn(
        "flex items-center gap-2 h-10 border rounded-xl px-3 text-sm bg-background transition-colors",
        open ? "border-primary ring-1 ring-primary/30" : "border-border"
      )}>
        <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          data-testid={testId}
          className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm min-w-0"
          placeholder={placeholder}
          value={open ? query : (selected ? selected.name : "")}
          onFocus={() => { setOpen(true); setQuery(""); }}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
        />
        {selected && (
          <button
            type="button"
            onClick={handleClear}
            className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-xl border border-border bg-popover shadow-lg overflow-hidden">
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">No accounts found</p>
            ) : (
              filtered.map(a => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => handleSelect(a.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between gap-2",
                    a.id === value ? "bg-primary/10 text-primary" : "hover:bg-accent/50 text-foreground"
                  )}
                >
                  <span className="font-medium">{a.name}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{ACCOUNT_TYPE_LABELS[a.type as AccountType]}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Ledger Entry Modal ───────────────────────────────────────────────────────

function EntryModal({
  entryType,
  accountHeads,
  onClose,
  onSave,
}: {
  entryType: EntryType;
  accountHeads: AccountHead[];
  onClose: () => void;
  onSave: (data: {
    accountHeadId: number;
    type: EntryType;
    amount: number;
    notes: string;
    entryDate: string;
    fromAccountId?: number | null;
    toAccountId?: number | null;
  }) => Promise<void>;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [entryDate, setEntryDate] = useState(today());
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [accountHeadId, setAccountHeadId] = useState<number | "">("");
  const [fromAccountId, setFromAccountId] = useState<number | "">("");
  const [toAccountId, setToAccountId] = useState<number | "">("");

  const creditorAccounts = accountHeads.filter(h => h.type === "creditor");
  const debtorAccounts = accountHeads.filter(h => h.type === "debtor");
  const paymentAccounts = accountHeads.filter(h => h.type === "bank" || h.type === "cash");
  const allAccounts = accountHeads;

  const titles: Record<EntryType, string> = {
    payable: "Record Payable",
    receivable: "Record Receivable",
    adjustment: "Adjustment Entry",
  };

  const icons: Record<EntryType, JSX.Element> = {
    payable: <TrendingDown className="w-5 h-5 text-rose-500" />,
    receivable: <TrendingUp className="w-5 h-5 text-emerald-500" />,
    adjustment: <ArrowLeftRight className="w-5 h-5 text-blue-500" />,
  };

  const iconBgs: Record<EntryType, string> = {
    payable: "bg-rose-100 dark:bg-rose-900/30",
    receivable: "bg-emerald-100 dark:bg-emerald-900/30",
    adjustment: "bg-blue-100 dark:bg-blue-900/30",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseInt(amount) <= 0) { toast({ title: "Enter a valid amount", variant: "destructive" }); return; }
    if (entryType !== "adjustment" && !accountHeadId) { toast({ title: "Select an account", variant: "destructive" }); return; }
    if (entryType === "payable" && !fromAccountId) { toast({ title: "Select payment account", variant: "destructive" }); return; }
    if (entryType === "adjustment" && (!fromAccountId || !toAccountId)) { toast({ title: "Select both accounts", variant: "destructive" }); return; }

    setSaving(true);
    try {
      await onSave({
        accountHeadId: entryType === "adjustment" ? (fromAccountId as number) : (accountHeadId as number),
        type: entryType,
        amount: parseInt(amount),
        notes,
        entryDate,
        fromAccountId: entryType === "payable" ? (fromAccountId as number) : entryType === "adjustment" ? (fromAccountId as number) : null,
        toAccountId: entryType === "adjustment" ? (toAccountId as number) : null,
      });
      onClose();
    } catch {
      toast({ title: "Failed to save entry", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in pb-16 sm:pb-0" onClick={onClose}>
      <div className="bg-card w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border mx-0 sm:mx-4 animate-in slide-in-from-bottom-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={cn("rounded-2xl p-2.5", iconBgs[entryType])}>
              {icons[entryType]}
            </div>
            <h2 className="font-bold text-lg text-foreground">{titles[entryType]}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Date</label>
            <input
              type="date"
              value={entryDate}
              onChange={e => setEntryDate(e.target.value)}
              data-testid="input-entry-date"
              className="w-full h-10 border border-border rounded-xl px-3 text-sm bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            />
          </div>

          {/* For Payable: choose payment source (bank/cash) */}
          {entryType === "payable" && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Pay From</label>
              <select
                value={fromAccountId}
                onChange={e => setFromAccountId(parseInt(e.target.value))}
                data-testid="select-from-account"
                className="w-full h-10 border border-border rounded-xl px-3 text-sm bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              >
                <option value="">Select Bank / Cash in Hand…</option>
                {paymentAccounts.map(h => (
                  <option key={h.id} value={h.id}>{h.name} ({ACCOUNT_TYPE_LABELS[h.type as AccountType]})</option>
                ))}
              </select>
              {paymentAccounts.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">No Bank or Cash in Hand account configured. Add one in Account Heads.</p>
              )}
            </div>
          )}

          {/* For Payable: choose creditor account */}
          {entryType === "payable" && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Account (Creditor)</label>
              <AccountCombobox
                accounts={creditorAccounts}
                value={accountHeadId}
                onChange={setAccountHeadId}
                placeholder="Type to search creditor…"
                testId="input-account-head"
              />
            </div>
          )}

          {/* For Receivable: choose debtor account */}
          {entryType === "receivable" && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Account (Debtor)</label>
              <AccountCombobox
                accounts={debtorAccounts}
                value={accountHeadId}
                onChange={setAccountHeadId}
                placeholder="Type to search debtor…"
                testId="input-account-head"
              />
            </div>
          )}

          {/* For Adjustment: From + To */}
          {entryType === "adjustment" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">From Account</label>
                <AccountCombobox
                  accounts={allAccounts}
                  value={fromAccountId}
                  onChange={setFromAccountId}
                  placeholder="Type to search account…"
                  testId="input-from-account"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">To Account</label>
                <AccountCombobox
                  accounts={allAccounts}
                  value={toAccountId}
                  onChange={setToAccountId}
                  placeholder="Type to search account…"
                  testId="input-to-account"
                />
              </div>
            </>
          )}

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Amount (₹)</label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              data-testid="input-entry-amount"
              className="w-full h-10 border border-border rounded-xl px-3 text-sm bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional description or reference…"
              rows={2}
              data-testid="input-entry-notes"
              className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              disabled={saving}
              data-testid="btn-save-entry"
              className={cn(
                "flex-1 text-white",
                entryType === "payable" ? "bg-rose-600 hover:bg-rose-700" :
                entryType === "receivable" ? "bg-emerald-600 hover:bg-emerald-700" :
                "bg-blue-600 hover:bg-blue-700"
              )}
            >
              {saving ? "Saving…" : "Save Entry"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Account Heads Tab ────────────────────────────────────────────────────────

function AccountHeadsTab({ accountHeads, entries }: { accountHeads: AccountHead[]; entries: LedgerEntry[] }) {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AccountHead | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const createMutation = useMutation({
    mutationFn: (data: Omit<AccountHead, "id" | "createdAt">) =>
      apiRequest("POST", "/api/account-heads", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account-heads"] });
      toast({ title: "Account created" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AccountHead> }) =>
      apiRequest("PATCH", `/api/account-heads/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account-heads"] });
      toast({ title: "Account updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/account-heads/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account-heads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ledger-entries"] });
      toast({ title: "Account deleted" });
      setDeletingId(null);
    },
    onError: () => {
      toast({ title: "Cannot delete — entries exist for this account", variant: "destructive" });
      setDeletingId(null);
    },
  });

  const grouped = useMemo(() => {
    const order: AccountType[] = ["bank", "cash", "creditor", "debtor"];
    const g: Partial<Record<AccountType, AccountHead[]>> = {};
    for (const t of order) {
      const rows = accountHeads.filter(h => h.type === t);
      if (rows.length) g[t] = rows;
    }
    return g;
  }, [accountHeads]);

  const currentBalances = useMemo(() => {
    const map = new Map<number, number>();
    for (const head of accountHeads) {
      const headEntries = entries.filter(e =>
        e.accountHeadId === head.id || e.fromAccountId === head.id || e.toAccountId === head.id
      );
      if (headEntries.length === 0) { map.set(head.id, head.openingBalance ?? 0); continue; }
      let bal = head.openingBalance ?? 0;
      for (const e of headEntries) {
        if (e.type === "receivable" && e.accountHeadId === head.id) bal += e.amount;
        else if (e.type === "payable" && e.fromAccountId === head.id) bal -= e.amount;
        else if (e.type === "payable" && e.accountHeadId === head.id) bal -= e.amount;
        else if (e.type === "adjustment" && e.fromAccountId === head.id) bal -= e.amount;
        else if (e.type === "adjustment" && e.toAccountId === head.id) bal += e.amount;
      }
      map.set(head.id, bal);
    }
    return map;
  }, [accountHeads, entries]);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted-foreground">{accountHeads.length} account{accountHeads.length !== 1 ? "s" : ""} configured</p>
        <Button
          onClick={() => { setEditing(undefined); setShowModal(true); }}
          data-testid="btn-add-account"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Account
        </Button>
      </div>

      {accountHeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="font-semibold text-foreground mb-1">No accounts yet</p>
          <p className="text-sm text-muted-foreground">Create your first account head to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(Object.entries(grouped) as [AccountType, AccountHead[]][]).map(([type, heads]) => (
            <div key={type}>
              <div className="flex items-center gap-2 mb-2">
                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", ACCOUNT_TYPE_COLORS[type])}>
                  {ACCOUNT_TYPE_ICONS[type]}
                  {ACCOUNT_TYPE_LABELS[type]}
                </span>
              </div>
              <div className="rounded-2xl border border-border overflow-hidden">
                {heads.map((h, i) => (
                  <div
                    key={h.id}
                    data-testid={`account-row-${h.id}`}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
                      i > 0 && "border-t border-border"
                    )}
                  >
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", ACCOUNT_TYPE_COLORS[type])}>
                      {ACCOUNT_TYPE_ICONS[type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">{h.name}</p>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        {(h.address || h.place) && (
                          <p className="text-xs text-muted-foreground truncate">{[h.address, h.place].filter(Boolean).join(", ")}</p>
                        )}
                        {(type === "bank" || type === "cash") && h.bookingMapping && h.bookingMapping !== "none" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                            Auto: {h.bookingMapping === "token" ? "Token" : h.bookingMapping === "balance" ? "Balance" : "Net Amount"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {(() => {
                        const opening = h.openingBalance ?? 0;
                        const curBal = currentBalances.get(h.id) ?? opening;
                        const hasEntries = curBal !== opening;
                        return (
                          <>
                            <p className="text-xs text-muted-foreground">Opening</p>
                            <p className="text-sm font-bold text-foreground">{fmt(opening)}</p>
                            {hasEntries && (
                              <p className={cn("text-[10px] font-semibold mt-1 leading-none", curBal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                                Cur. Bal: {fmt(Math.abs(curBal))} {curBal >= 0 ? "CR" : "DR"}
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                      <button
                        onClick={() => { setEditing(h); setShowModal(true); }}
                        data-testid={`btn-edit-account-${h.id}`}
                        className="w-7 h-7 rounded-lg hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {deletingId === h.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => deleteMutation.mutate(h.id)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20"
                            data-testid={`btn-confirm-delete-${h.id}`}
                          >Confirm</button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="text-xs font-semibold text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted"
                          >Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(h.id)}
                          data-testid={`btn-delete-account-${h.id}`}
                          className="w-7 h-7 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/20 flex items-center justify-center text-muted-foreground hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AccountHeadModal
          initial={editing}
          allAccountHeads={accountHeads}
          currentBalance={editing ? (currentBalances.get(editing.id) ?? editing.openingBalance ?? 0) : undefined}
          onClose={() => { setShowModal(false); setEditing(undefined); }}
          onSave={async (data) => {
            if (editing) {
              await updateMutation.mutateAsync({ id: editing.id, data });
            } else {
              await createMutation.mutateAsync(data);
            }
          }}
        />
      )}
    </div>
  );
}

// ─── Ledger Tab ───────────────────────────────────────────────────────────────

function LedgerTab({
  accountHeads: propAccountHeads,
  entries: propEntries,
}: {
  accountHeads: AccountHead[];
  entries: LedgerEntry[];
}) {
  const { toast } = useToast();
  const [entryModal, setEntryModal] = useState<EntryType | null>(null);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [exportModal, setExportModal] = useState(false);
  const [exportSelectedHeads, setExportSelectedHeads] = useState<Set<number>>(new Set());
  const [exportView, setExportView] = useState<"detailed" | "summary">("detailed");

  // Own queries so Refresh directly updates this component without parent prop propagation
  const { data: entries = propEntries, refetch: refetchEntries } = useQuery<LedgerEntry[]>({
    queryKey: ["/api/ledger-entries"],
  });
  const { data: accountHeads = propAccountHeads, refetch: refetchHeads } = useQuery<AccountHead[]>({
    queryKey: ["/api/account-heads"],
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // First sync any missing settlement entries, then reload
      const data: any = await apiRequest("POST", "/api/accounting/sync-settlements");
      await Promise.all([refetchEntries(), refetchHeads()]);
      const added   = data?.created ?? 0;
      const deleted = data?.removed ?? 0;
      const parts = [];
      if (added > 0)   parts.push(`${added} added`);
      if (deleted > 0) parts.push(`${deleted} removed`);
      toast({
        title: parts.length > 0 ? `Ledger updated — ${parts.join(", ")}` : "Ledger refreshed",
        description: parts.length > 0 ? "Entries synced with current settlement status." : undefined,
      });
    } catch {
      // Even if sync fails, still refresh display
      await Promise.all([refetchEntries(), refetchHeads()]);
      toast({ title: "Ledger refreshed" });
    }
    setRefreshing(false);
  };

  // Per-account CSV download (small button on each account header)
  const downloadLedgerCSV = (filterHeadId: number) => {
    const q = (val: string | number | null | undefined) =>
      `"${String(val ?? "").replace(/"/g, '""')}"`;
    const headers = ["Account", "Account Type", "Date", "Entry Type", "Debit", "Credit", "Notes", "From Account", "To Account", "Running Balance"];
    const rows: string[][] = [headers];
    const group = allGrouped.get(filterHeadId);
    if (!group) return;
    const { head, entries: groupEntries } = group;
    let running = head.openingBalance ?? 0;
    if (running > 0) {
      rows.push([q(head.name), q(ACCOUNT_TYPE_LABELS[head.type as AccountType] ?? head.type), q(""), q("Opening Balance"), q(""), q(running), q(""), q(""), q(""), q(running)]);
    }
    for (const e of groupEntries) {
      const debit = e.type === "payable" ? e.amount : "";
      const credit = e.type === "receivable" ? e.amount : "";
      if (e.type === "payable") running -= e.amount;
      else if (e.type === "receivable") running += e.amount;
      rows.push([q(head.name), q(ACCOUNT_TYPE_LABELS[head.type as AccountType] ?? head.type), q(e.entryDate ? format(new Date(e.entryDate + "T00:00:00"), "dd-MMM-yyyy") : ""), q(e.type.charAt(0).toUpperCase() + e.type.slice(1)), q(debit), q(credit), q(e.notes), q(e.fromAccountId ? (accountMap.get(e.fromAccountId)?.name ?? "") : ""), q(e.toAccountId ? (accountMap.get(e.toAccountId)?.name ?? "") : ""), q(running)]);
    }
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ledger-${head.name.replace(/\s+/g, "-").toLowerCase()}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Open export modal with all accounts pre-selected
  const openExportModal = () => {
    setExportSelectedHeads(new Set([...allGrouped.keys()]));
    setExportView("detailed");
    setExportModal(true);
  };

  // Execute export from the modal
  const handleExportCSV = () => {
    const q = (val: string | number | null | undefined) =>
      `"${String(val ?? "").replace(/"/g, '""')}"`;
    const selectedGroups = [...allGrouped.values()].filter(g => exportSelectedHeads.has(g.head.id));
    let rows: string[][];

    if (exportView === "summary") {
      rows = [["Account", "Account Type", "Opening Balance", "Total Received (CR)", "Total Paid (DR)", "Adj In", "Adj Out", "Net Balance"]];
      for (const { head, entries: he } of selectedGroups) {
        const totalRec = he.filter(e => e.type === "receivable").reduce((s, e) => s + e.amount, 0);
        const totalPay = he.filter(e => e.type === "payable").reduce((s, e) => s + e.amount, 0);
        const adjOut   = he.filter(e => e.type === "adjustment" && e.fromAccountId === head.id).reduce((s, e) => s + e.amount, 0);
        const adjIn    = he.filter(e => e.type === "adjustment" && e.toAccountId   === head.id).reduce((s, e) => s + e.amount, 0);
        const net = (head.openingBalance ?? 0) + totalRec - totalPay - adjOut + adjIn;
        rows.push([q(head.name), q(ACCOUNT_TYPE_LABELS[head.type as AccountType] ?? head.type), q(head.openingBalance ?? 0), q(totalRec), q(totalPay), q(adjIn), q(adjOut), q(net)]);
      }
    } else {
      rows = [["Account", "Account Type", "Date", "Entry Type", "Debit", "Credit", "Notes", "From Account", "To Account", "Running Balance"]];
      for (const { head, entries: he } of selectedGroups) {
        let running = head.openingBalance ?? 0;
        if (running > 0) {
          rows.push([q(head.name), q(ACCOUNT_TYPE_LABELS[head.type as AccountType] ?? head.type), q(""), q("Opening Balance"), q(""), q(running), q(""), q(""), q(""), q(running)]);
        }
        for (const e of he) {
          const debit = e.type === "payable" ? e.amount : "";
          const credit = e.type === "receivable" ? e.amount : "";
          if (e.type === "payable") running -= e.amount;
          else if (e.type === "receivable") running += e.amount;
          rows.push([q(head.name), q(ACCOUNT_TYPE_LABELS[head.type as AccountType] ?? head.type), q(e.entryDate ? format(new Date(e.entryDate + "T00:00:00"), "dd-MMM-yyyy") : ""), q(e.type.charAt(0).toUpperCase() + e.type.slice(1)), q(debit), q(credit), q(e.notes), q(e.fromAccountId ? (accountMap.get(e.fromAccountId)?.name ?? "") : ""), q(e.toAccountId ? (accountMap.get(e.toAccountId)?.name ?? "") : ""), q(running)]);
        }
      }
    }

    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ledger-${exportView}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportModal(false);
  };

  const accountMap = useMemo(() => {
    const m = new Map<number, AccountHead>();
    for (const h of accountHeads) m.set(h.id, h);
    return m;
  }, [accountHeads]);

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof apiRequest>[2]) =>
      apiRequest("POST", "/api/ledger-entries", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ledger-entries"] });
      toast({ title: "Entry recorded" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/ledger-entries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ledger-entries"] });
      toast({ title: "Entry deleted" });
    },
  });

  const grouped = useMemo(() => {
    const q = search.toLowerCase();
    const result = new Map<number, { head: AccountHead; entries: LedgerEntry[] }>();
    for (const head of accountHeads) {
      if (q && !head.name.toLowerCase().includes(q)) continue;
      const headEntries = entries
        .filter(e => e.accountHeadId === head.id || e.fromAccountId === head.id || e.toAccountId === head.id)
        .sort((a, b) => a.entryDate.localeCompare(b.entryDate));
      if (headEntries.length > 0) {
        result.set(head.id, { head, entries: headEntries });
      }
    }
    return result;
  }, [accountHeads, entries, search]);

  // Un-filtered groups for export (ignores search box)
  const allGrouped = useMemo(() => {
    const result = new Map<number, { head: AccountHead; entries: LedgerEntry[] }>();
    for (const head of accountHeads) {
      const headEntries = entries
        .filter(e => e.accountHeadId === head.id || e.fromAccountId === head.id || e.toAccountId === head.id)
        .sort((a, b) => a.entryDate.localeCompare(b.entryDate));
      if (headEntries.length > 0) {
        result.set(head.id, { head, entries: headEntries });
      }
    }
    return result;
  }, [accountHeads, entries]);

  const totals = useMemo(() => {
    let totalPayable = 0, totalReceivable = 0;
    // Only count actual money accounts (bank + cash + petty cash), not debtor tracking entries
    const moneyAccountIds = new Set(
      accountHeads
        .filter(h => (h as any).type === "bank" || (h as any).type === "cash")
        .map(h => h.id)
    );
    for (const e of entries) {
      if (!moneyAccountIds.has(e.accountHeadId)) continue;
      if (e.type === "payable") totalPayable += e.amount;
      if (e.type === "receivable") totalReceivable += e.amount;
    }

    // Net Balance = sum of individual balances for bank + cash accounts,
    // computed using the same formula as the per-account header so they always match.
    const cashBankHeads = accountHeads.filter(h => (h as any).type === "bank" || (h as any).type === "cash");
    let net = 0;
    for (const head of cashBankHeads) {
      const headEntries = entries.filter(e =>
        e.accountHeadId === head.id || e.fromAccountId === head.id || e.toAccountId === head.id
      );
      const totalRec = headEntries.filter(e => e.type === "receivable").reduce((s, e) => s + e.amount, 0);
      const totalPay = headEntries.filter(e => e.type === "payable").reduce((s, e) => s + e.amount, 0);
      const adjOut   = headEntries.filter(e => e.type === "adjustment" && e.fromAccountId === head.id).reduce((s, e) => s + e.amount, 0);
      const adjIn    = headEntries.filter(e => e.type === "adjustment" && e.toAccountId   === head.id).reduce((s, e) => s + e.amount, 0);
      net += (head.openingBalance ?? 0) + totalRec - totalPay - adjOut + adjIn;
    }

    return { totalPayable, totalReceivable, net };
  }, [entries, accountHeads]);

  const toggleCollapse = (id: number) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const entryTypeLabel: Record<EntryType, string> = {
    payable: "Payable",
    receivable: "Receivable",
    adjustment: "Adjustment",
  };

  const entryTypeColors: Record<EntryType, string> = {
    payable: "text-rose-600 dark:text-rose-400",
    receivable: "text-emerald-600 dark:text-emerald-400",
    adjustment: "text-blue-600 dark:text-blue-400",
  };

  const entryTypeBg: Record<EntryType, string> = {
    payable: "bg-rose-50 dark:bg-rose-900/20",
    receivable: "bg-emerald-50 dark:bg-emerald-900/20",
    adjustment: "bg-blue-50 dark:bg-blue-900/20",
  };

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-2xl border border-border bg-card px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Paid</p>
          <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{fmt(totals.totalPayable)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Received</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{fmt(totals.totalReceivable)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Net Balance</p>
          <p className={cn("text-lg font-bold", totals.net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
            {fmt(Math.abs(totals.net))} {totals.net >= 0 ? "CR" : "DR"}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setEntryModal("payable")}
          data-testid="btn-add-payable"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors shadow-sm"
        >
          <TrendingDown className="w-4 h-4" /> Payable
        </button>
        <button
          onClick={() => setEntryModal("receivable")}
          data-testid="btn-add-receivable"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-sm"
        >
          <TrendingUp className="w-4 h-4" /> Receivable
        </button>
        <button
          onClick={() => setEntryModal("adjustment")}
          data-testid="btn-add-adjustment"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm"
        >
          <ArrowLeftRight className="w-4 h-4" /> Adjustment
        </button>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          data-testid="btn-refresh-ledger"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border hover:bg-muted text-sm font-semibold transition-colors text-foreground disabled:opacity-60"
        >
          <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
        <button
          onClick={openExportModal}
          data-testid="btn-export-ledger"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border hover:bg-muted text-sm font-semibold transition-colors text-foreground"
        >
          <FileDown className="w-4 h-4" /> Export
        </button>

        <div className="flex-1 min-w-[160px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search account…"
              data-testid="input-ledger-search"
              className="w-full h-9 border border-border rounded-xl pl-8 pr-3 text-sm bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      {/* Ledger grouped by account */}
      {grouped.size === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
            <BookOpen className="w-7 h-7 text-muted-foreground/50" />
          </div>
          <p className="font-semibold text-foreground mb-1">No ledger entries</p>
          <p className="text-sm text-muted-foreground">Add a Payable, Receivable or Adjustment entry above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...grouped.values()].map(({ head, entries: groupEntries }) => {
            const isCollapsed = collapsed.has(head.id);
            const totalPay = groupEntries.filter(e => e.type === "payable").reduce((s, e) => s + e.amount, 0);
            const totalRec = groupEntries.filter(e => e.type === "receivable").reduce((s, e) => s + e.amount, 0);
            const adjOut = groupEntries.filter(e => e.type === "adjustment" && e.fromAccountId === head.id).reduce((s, e) => s + e.amount, 0);
            const adjIn  = groupEntries.filter(e => e.type === "adjustment" && e.toAccountId   === head.id).reduce((s, e) => s + e.amount, 0);
            const net = (head.openingBalance ?? 0) + totalRec - totalPay - adjOut + adjIn;

            return (
              <div key={head.id} className="rounded-2xl border border-border overflow-hidden">
                {/* Account Header */}
                <button
                  onClick={() => toggleCollapse(head.id)}
                  data-testid={`ledger-group-${head.id}`}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-muted/50 hover:bg-muted/80 transition-colors"
                >
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", ACCOUNT_TYPE_COLORS[head.type as AccountType])}>
                    {ACCOUNT_TYPE_ICONS[head.type as AccountType]}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <p className="font-bold text-sm text-foreground">{head.name}</p>
                      <span className={cn("text-[10px] font-semibold", net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                        ({net >= 0 ? "Cr." : "Dr."})
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{ACCOUNT_TYPE_LABELS[head.type as AccountType]} · {groupEntries.length} entries</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">Net</p>
                    <p className={cn("text-sm font-bold", net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                      {fmt(Math.abs(net))} {net >= 0 ? "CR" : "DR"}
                    </p>
                  </div>
                  <button
                    onClick={(ev) => { ev.stopPropagation(); downloadLedgerCSV(head.id); }}
                    data-testid={`btn-export-account-${head.id}`}
                    title="Download party ledger as CSV"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                  </button>
                  {isCollapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                </button>

                {/* Opening Balance row */}
                {!isCollapsed && (head.openingBalance ?? 0) > 0 && (
                  <div className="flex items-center gap-3 px-4 py-2 border-t border-border bg-background/50">
                    <div className="w-8 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-xs font-semibold text-muted-foreground italic">Opening Balance</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{fmt(head.openingBalance ?? 0)}</span>
                    <div className="w-6" />
                  </div>
                )}

                {/* Entries */}
                {!isCollapsed && groupEntries.map((entry, i) => {
                  const fromAcc = entry.fromAccountId ? accountMap.get(entry.fromAccountId) : null;
                  const toAcc = entry.toAccountId ? accountMap.get(entry.toAccountId) : null;
                  const isAdjOut = entry.type === "adjustment" && entry.fromAccountId === head.id;
                  const isAdjIn  = entry.type === "adjustment" && entry.toAccountId   === head.id;
                  const amtSign = entry.type === "payable" ? "−"
                    : entry.type === "receivable" ? "+"
                    : isAdjOut ? "−"
                    : isAdjIn  ? "+"
                    : "~";
                  const amtColor = entry.type === "payable" ? "text-rose-600 dark:text-rose-400"
                    : entry.type === "receivable" ? "text-emerald-600 dark:text-emerald-400"
                    : isAdjOut ? "text-rose-600 dark:text-rose-400"
                    : isAdjIn  ? "text-emerald-600 dark:text-emerald-400"
                    : "text-blue-600 dark:text-blue-400";
                  return (
                    <div
                      key={entry.id}
                      data-testid={`ledger-entry-${entry.id}`}
                      className={cn("flex items-start gap-3 px-4 py-3 border-t border-border hover:bg-muted/30 transition-colors group")}
                    >
                      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5", entryTypeBg[entry.type as EntryType])}>
                        {entry.type === "payable" && <TrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
                        {entry.type === "receivable" && <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                        {isAdjOut && <TrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
                        {isAdjIn  && <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                        {entry.type === "adjustment" && !isAdjOut && !isAdjIn && <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn("text-xs font-bold uppercase tracking-wide", entryTypeColors[entry.type as EntryType])}>
                            {entry.type === "adjustment"
                              ? (isAdjOut ? "Transfer Out" : isAdjIn ? "Transfer In" : "Adjustment")
                              : entryTypeLabel[entry.type as EntryType]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {entry.entryDate ? format(new Date(entry.entryDate + "T00:00:00"), "dd MMM yyyy") : "—"}
                          </span>
                        </div>
                        {entry.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.notes}</p>}
                        {fromAcc && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {entry.type === "payable" ? "Paid from: " : "From: "}<span className="font-medium text-foreground">{fromAcc.name}</span>
                          </p>
                        )}
                        {toAcc && (
                          <p className="text-xs text-muted-foreground">
                            To: <span className="font-medium text-foreground">{toAcc.name}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn("text-sm font-bold", amtColor)}>
                          {amtSign}{fmt(entry.amount)}
                        </span>
                        <button
                          onClick={() => deleteMutation.mutate(entry.id)}
                          data-testid={`btn-delete-entry-${entry.id}`}
                          className="w-6 h-6 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-100 dark:hover:bg-rose-900/20 flex items-center justify-center text-muted-foreground hover:text-rose-600 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Footer totals */}
                {!isCollapsed && groupEntries.length > 0 && (
                  <div className="flex items-center gap-4 px-4 py-2 border-t border-border bg-muted/30">
                    <div className="w-8 flex-shrink-0" />
                    <div className="flex-1 flex items-center gap-4 text-xs text-muted-foreground">
                      {totalPay > 0 && <span>Paid: <span className="font-semibold text-rose-600 dark:text-rose-400">{fmt(totalPay)}</span></span>}
                      {totalRec > 0 && <span>Received: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{fmt(totalRec)}</span></span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {entryModal && (
        <EntryModal
          entryType={entryModal}
          accountHeads={accountHeads}
          onClose={() => setEntryModal(null)}
          onSave={async (data) => {
            await createMutation.mutateAsync(data);
          }}
        />
      )}

      {/* Export Modal */}
      {exportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setExportModal(false)}>
          <div className="bg-card rounded-2xl border border-border w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <FileDown className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-base">Export Ledger</h3>
              </div>
              <button onClick={() => setExportModal(false)} className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-5">
              {/* View type */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Export Type</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["detailed", "summary"] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => setExportView(v)}
                      className={cn(
                        "px-3 py-2 rounded-xl text-sm font-semibold border transition-colors",
                        exportView === v
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-muted text-foreground"
                      )}
                    >
                      {v === "detailed" ? "Detailed (All Entries)" : "Summary (Totals Only)"}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {exportView === "detailed"
                    ? "Every transaction line with running balance."
                    : "One row per account showing opening balance, totals and net."}
                </p>
              </div>

              {/* Account selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Accounts</p>
                  <button
                    onClick={() => {
                      const all = [...allGrouped.keys()];
                      if (exportSelectedHeads.size === all.length) {
                        setExportSelectedHeads(new Set());
                      } else {
                        setExportSelectedHeads(new Set(all));
                      }
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    {exportSelectedHeads.size === allGrouped.size ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div className="max-h-52 overflow-y-auto space-y-0.5 rounded-xl border border-border bg-muted/30 p-1">
                  {[...allGrouped.values()].map(({ head }) => (
                    <label
                      key={head.id}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={exportSelectedHeads.has(head.id)}
                        onChange={() => {
                          setExportSelectedHeads(prev => {
                            const next = new Set(prev);
                            if (next.has(head.id)) next.delete(head.id);
                            else next.add(head.id);
                            return next;
                          });
                        }}
                        className="rounded"
                      />
                      <span className="flex-1 text-sm font-medium truncate">{head.name}</span>
                      <span className={cn("text-xs px-1.5 py-0.5 rounded-md font-medium", ACCOUNT_TYPE_COLORS[head.type as AccountType])}>
                        {head.type}
                      </span>
                    </label>
                  ))}
                  {allGrouped.size === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No accounts with entries</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{exportSelectedHeads.size} of {allGrouped.size} selected</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-5">
              <button
                onClick={handleExportCSV}
                disabled={exportSelectedHeads.size === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FileDown className="w-4 h-4" /> Download CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "heads" | "ledger";

export default function Accounting() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const urlTab = new URLSearchParams(location.split("?")[1] ?? "").get("tab") as Tab | null;
  const [tab, setTab] = useState<Tab>(urlTab === "heads" ? "heads" : "ledger");

  const handleTabChange = (t: Tab) => {
    setTab(t);
    navigate(`/accounting?tab=${t}`, { replace: true });
  };

  const { data: accountHeads = [], isLoading: headsLoading } = useQuery<AccountHead[]>({
    queryKey: ["/api/account-heads"],
    enabled: !!user?.isAdmin,
  });

  const { data: entries = [], isLoading: entriesLoading } = useQuery<LedgerEntry[]>({
    queryKey: ["/api/ledger-entries"],
    enabled: !!user?.isAdmin,
  });

  if (!user?.isAdmin) {
    navigate("/");
    return null;
  }

  const isLoading = headsLoading || entriesLoading;

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground leading-tight">Accounting</h1>
            <p className="text-sm text-muted-foreground">Manage account heads and party ledger</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-border -mt-1">
          {([
            { key: "ledger", label: "Ledger", icon: <BookOpen className="w-4 h-4" /> },
            { key: "heads", label: "Account Heads", icon: <Building2 className="w-4 h-4" /> },
          ] as { key: Tab; label: string; icon: JSX.Element }[]).map(t => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              data-testid={`tab-${t.key}`}
              className={cn(
                "flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px",
                tab === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : tab === "heads" ? (
          <AccountHeadsTab accountHeads={accountHeads} entries={entries} />
        ) : (
          <LedgerTab accountHeads={accountHeads} entries={entries} />
        )}
      </div>
    </AppLayout>
  );
}
