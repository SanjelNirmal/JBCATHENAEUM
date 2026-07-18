import { Bookmark, BookmarkCheck, Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCurrentAuth } from "../../app/AuthContext";
import { toSafeErrorMessage } from "../../lib/supabase/errors";
import { useResourceBookmark, useResourceRatings } from "./hooks";

export function ResourceEngagementPanel({
  resourceId,
}: {
  resourceId: string;
}) {
  const auth = useCurrentAuth();
  const bookmark = useResourceBookmark(resourceId, auth.user?.id);
  const ratings = useResourceRatings(resourceId, auth.user?.id);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!ratings.own.data) return;
    setRating(ratings.own.data.rating);
    setReviewText(ratings.own.data.reviewText ?? "");
  }, [ratings.own.data]);

  const toggleBookmark = async () => {
    setMessage("");
    const nextBookmarked = !bookmark.data;
    try {
      await bookmark.toggle(nextBookmarked);
      setMessage(nextBookmarked ? "Resource saved." : "Bookmark removed.");
    } catch (error) {
      setMessage(toSafeErrorMessage(error));
    }
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    if (rating < 1 || rating > 5) {
      setMessage("Choose a rating from 1 to 5 stars.");
      return;
    }
    try {
      await ratings.save.mutateAsync({ rating, reviewText });
      setMessage("Your rating was saved.");
    } catch (error) {
      setMessage(toSafeErrorMessage(error));
    }
  };

  const removeRating = async () => {
    setMessage("");
    try {
      await ratings.remove.mutateAsync();
      setRating(0);
      setReviewText("");
      setMessage("Your rating was removed.");
    } catch (error) {
      setMessage(toSafeErrorMessage(error));
    }
  };

  const summary = ratings.summary.data;
  return (
    <section
      aria-labelledby="resource-rating-heading"
      className="mt-6 border-t border-slate-200 pt-6"
    >
      <h2
        id="resource-rating-heading"
        className="font-serif text-xl font-bold text-[#002147]"
      >
        Save and rate
      </h2>
      <div className="mt-3 flex items-center gap-2" aria-live="polite">
        <Star
          size={19}
          className="fill-[#b7791f] text-[#b7791f]"
          aria-hidden="true"
        />
        {ratings.summary.isLoading ? (
          <span className="text-sm text-slate-500">Loading rating…</span>
        ) : ratings.summary.isError ? (
          <span className="text-sm text-slate-500">Rating unavailable</span>
        ) : (
          <span className="text-sm font-semibold text-slate-700">
            {summary?.ratingCount
              ? `${summary.averageRating.toFixed(1)} from ${summary.ratingCount.toLocaleString()} rating${summary.ratingCount === 1 ? "" : "s"}`
              : "Not rated yet"}
          </span>
        )}
      </div>

      {!auth.user ? (
        <Link
          to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
          className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-[#002147] px-4 text-sm font-bold text-[#002147]"
        >
          Sign in to save or rate
        </Link>
      ) : (
        <>
          <button
            type="button"
            disabled={bookmark.isLoading || bookmark.mutation.isPending}
            onClick={() => void toggleBookmark()}
            aria-pressed={Boolean(bookmark.data)}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#002147] px-4 text-sm font-bold text-[#002147] disabled:opacity-50"
          >
            {bookmark.data ? (
              <BookmarkCheck size={18} aria-hidden="true" />
            ) : (
              <Bookmark size={18} aria-hidden="true" />
            )}
            {bookmark.data ? "Saved" : "Save resource"}
          </button>

          <form onSubmit={save} className="mt-5 space-y-4">
            <fieldset>
              <legend className="text-sm font-bold text-slate-700">
                Your rating
              </legend>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    aria-label={`Rate ${value} out of 5`}
                    aria-pressed={rating === value}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-amber-50"
                  >
                    <Star
                      size={24}
                      aria-hidden="true"
                      className={
                        value <= rating
                          ? "fill-[#b7791f] text-[#b7791f]"
                          : "text-slate-300"
                      }
                    />
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="block text-sm font-bold text-slate-700">
              Optional review
              <textarea
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="What was useful about this resource?"
                className="mt-1 w-full rounded-lg border border-slate-300 p-3 font-normal"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                disabled={ratings.save.isPending || ratings.own.isLoading}
                className="min-h-11 flex-1 rounded-lg bg-[#002147] px-4 text-sm font-bold text-white disabled:opacity-50"
              >
                {ratings.save.isPending
                  ? "Saving…"
                  : ratings.own.data
                    ? "Update rating"
                    : "Save rating"}
              </button>
              {ratings.own.data && (
                <button
                  type="button"
                  disabled={ratings.remove.isPending}
                  onClick={() => void removeRating()}
                  aria-label="Delete my rating"
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-bold text-red-700 disabled:opacity-50"
                >
                  <Trash2 size={16} aria-hidden="true" /> Delete
                </button>
              )}
            </div>
          </form>
        </>
      )}
      {message && (
        <p role="status" className="mt-4 rounded-lg bg-slate-100 p-3 text-sm">
          {message}
        </p>
      )}
    </section>
  );
}
