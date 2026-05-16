import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { getApiUrl } from "@/lib/queryClient";
import type { Banner, InsertBanner } from "@shared/schema";

export function useBanners() {
  return useQuery({
    queryKey: [api.banners.list.path],
    queryFn: async () => {
      const res = await fetch(getApiUrl(api.banners.list.path));
      if (!res.ok) throw new Error("Failed to fetch banners");
      return api.banners.list.responses[200].parse(await res.json());
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertBanner) => {
      const res = await fetch(getApiUrl(api.banners.create.path), {
        method: api.banners.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create banner");
      return api.banners.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.banners.list.path] });
    },
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InsertBanner> & { id: number }) => {
      const url = buildUrl(api.banners.update.path, { id });
      const res = await fetch(getApiUrl(url), {
        method: api.banners.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update banner");
      return api.banners.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.banners.list.path] });
    },
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.banners.delete.path, { id });
      const res = await fetch(getApiUrl(url), {
        method: api.banners.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete banner");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.banners.list.path] });
    },
  });
}