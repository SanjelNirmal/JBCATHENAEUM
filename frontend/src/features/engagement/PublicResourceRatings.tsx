import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LoadingState, ErrorState, EmptyState } from "../../components/AsyncState";
import { fetchPublicResourceRatings } from "../../lib/supabase/resources";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => index + 1).map((value) => (
        <Star
          key={value}
          size={15}
          aria-hidden="true"
          className={value <= rating ? "fill-[#b7791f] text-[#b7791f]" : "text-slate-300"}
        />
      ))}
    </span>
  );
}

export function PublicResourceRatings({ resourceId }: { resourceId: string }) {
  const query = useQuery({
    queryKey: ["public-resource-ratings", resourceId],
    queryFn: () => fetchPublicResourceRatings(resourceId, 1, 6),
    enabled: Boolean(resourceId),
  });

  return (
    <section className="mt-6 border-t border-slate-200 pt-6">
      <h2 className="font-serif text-xl font-bold text-[#002147]">
        Recent public ratings
      </h2>
      {query.isLoading ? (
        <LoadingState label="Loading public ratings" />
      ) : query.isError ? (
        <ErrorState message="Public ratings could not be loaded." retry={() => void query.refetch()} />
      ) : !query.data?.items.length ? (
        <EmptyState
          title="No public ratings yet"
          message="Be the first authenticated user to rate this resource."
        />
      ) : (
        <div className="mt-4 space-y-3">
          {query.data.items.map((rating) => (
            <article
              key={rating.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#002147] text-sm font-black text-white">
                  {rating.reviewerAvatarUrl ? (
                    <img
                      src={rating.reviewerAvatarUrl}
                      alt={`${rating.reviewerName} avatar`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials(rating.reviewerName) || "JB"
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      to={`/contributors/${rating.reviewerId}`}
                      className="font-semibold text-[#002147] underline-offset-2 hover:underline"
                    >
                      {rating.reviewerName}
                    </Link>
                    <Stars rating={rating.rating} />
                  </div>
                  <p className="text-xs text-slate-500">{rating.reviewerFaculty}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {rating.reviewText || "No written review provided."}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
