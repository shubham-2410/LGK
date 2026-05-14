import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useBanners } from "@/hooks/use-banners";
import { Skeleton } from "@/components/ui/skeleton";

function isBannerExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiresAt);
  expiry.setHours(0, 0, 0, 0);
  return expiry < today;
}

export function BannerSlider() {
  const { data: banners, isLoading } = useBanners();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi, setSelectedIndex]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [emblaApi, onSelect]);

  if (isLoading) {
    return (
      <Skeleton className="w-full h-52 sm:h-64 md:h-80 lg:h-[420px] rounded-none sm:rounded-2xl" />
    );
  }

  const activeBanners = (banners || []).filter(
    (b) => b.isActive && !isBannerExpired(b.expiresAt)
  );

  if (activeBanners.length === 0) {
    return (
      <div className="relative w-full h-52 sm:h-64 md:h-80 lg:h-[420px] sm:rounded-2xl overflow-hidden bg-muted">
        <img
          src="/banner-kayaking.png"
          alt="Kayaking In Goa"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent flex items-end p-5 md:p-8">
          <h2 className="text-white text-2xl md:text-4xl font-bold font-display drop-shadow-lg">
            Kayaking In Goa
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden sm:rounded-2xl" ref={emblaRef}>
      <div className="flex touch-pan-y">
        {activeBanners.map((banner) => (
          <div
            key={banner.id}
            className="flex-[0_0_100%] min-w-0 relative h-52 sm:h-64 md:h-80 lg:h-[420px]"
          >
            <img
              src={banner.imageUrl}
              alt={banner.title}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent flex items-end">
              <div className="p-5 md:p-8 w-full">
                <h2 className="text-white text-2xl md:text-4xl font-bold font-display drop-shadow-lg mb-2">
                  {banner.title}
                </h2>
                <div className="w-12 h-1 bg-accent rounded-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {activeBanners.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {activeBanners.map((_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === selectedIndex ? "bg-accent w-6" : "bg-white/50 w-2"
              }`}
              onClick={() => emblaApi?.scrollTo(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
