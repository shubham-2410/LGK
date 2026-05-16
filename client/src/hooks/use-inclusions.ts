import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/queryClient";
import type { Inclusion } from "@shared/schema";

export function useInclusions() {
  return useQuery<Inclusion[]>({
    queryKey: ["/api/inclusions"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/inclusions"));
      if (!res.ok) throw new Error("Failed to fetch inclusions");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateInclusion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; icon: string }) => {
      const res = await fetch(getApiUrl("/api/inclusions"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create inclusion");
      }
      return res.json() as Promise<Inclusion>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/inclusions"] }),
  });
}

export function useDeleteInclusion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await fetch(getApiUrl(`/api/inclusions/${id}`), { method: "DELETE", credentials: "include" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/inclusions"] }),
  });
}
