import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { PaymentSettings } from "@shared/schema";

const QUERY_KEY = [api.paymentSettings.get.path];

export function usePaymentSettings() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await fetch(api.paymentSettings.get.path);
      if (!res.ok) throw new Error("Failed to fetch payment settings");
      return res.json() as Promise<PaymentSettings>;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useUpdatePaymentSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<PaymentSettings>) => {
      const res = await fetch(api.paymentSettings.update.path, {
        method: api.paymentSettings.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to update" }));
        throw new Error(err.message || "Failed to update payment settings");
      }
      return res.json() as Promise<PaymentSettings>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data);
    },
  });
}
