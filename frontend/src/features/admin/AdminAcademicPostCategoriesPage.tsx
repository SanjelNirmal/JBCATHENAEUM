import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save } from "lucide-react";
import { useState } from "react";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../components/AsyncState";
import { Seo } from "../../components/Seo";
import type { AcademicPostCategory } from "../academic-posts/types";
import {
  createAcademicPostCategory,
  fetchAcademicPostCategories,
  slugifyAcademicPost,
  updateAcademicPostCategory,
} from "../../lib/supabase/academicPosts";
import { toSafeErrorMessage } from "../../lib/supabase/errors";

export default function AdminAcademicPostCategoriesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const categories = useQuery({
    queryKey: ["academic-post-categories", "admin"],
    queryFn: () => fetchAcademicPostCategories(true),
  });
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["academic-post-categories"] });

  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusyId("new");
    setMessage("");
    try {
      await createAcademicPostCategory({
        name: String(form.get("name")),
        slug: String(form.get("slug")),
        description: String(form.get("description")),
        sortOrder: Number(form.get("sortOrder")),
      });
      event.currentTarget.reset();
      setShowCreate(false);
      setMessage("Category created.");
      await refresh();
    } catch (error) {
      setMessage(toSafeErrorMessage(error));
    } finally {
      setBusyId("");
    }
  };

  const save = async (
    category: AcademicPostCategory,
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusyId(category.id);
    setMessage("");
    try {
      await updateAcademicPostCategory(category.id, {
        name: String(form.get("name")),
        slug: String(form.get("slug")),
        description: String(form.get("description")),
        isActive: form.get("isActive") === "on",
        sortOrder: Number(form.get("sortOrder")),
      });
      setMessage(`${category.name} updated.`);
      await refresh();
    } catch (error) {
      setMessage(toSafeErrorMessage(error));
    } finally {
      setBusyId("");
    }
  };

  return (
    <main id="main-content">
      <Seo
        title="Academic post categories"
        description="Manage academic post categories."
        path="/admin/post-categories"
        noIndex
      />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#002147]">
            Post categories
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Categories power both academic resources and campus news. Deactivate
            a category to hide it from new public filters without breaking
            existing posts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((value) => !value)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#002147] px-4 font-bold text-white"
        >
          <Plus size={18} aria-hidden="true" />
          New category
        </button>
      </div>

      {message && (
        <p className="mt-5 rounded-xl bg-slate-100 p-4 text-sm" role="status">
          {message}
        </p>
      )}

      {showCreate && (
        <form
          onSubmit={(event) => void create(event)}
          className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-2"
        >
          <label className="text-sm font-semibold">
            Name
            <input
              name="name"
              required
              minLength={2}
              maxLength={100}
              onChange={(event) => {
                const form = event.currentTarget.form;
                const slugInput = form?.elements.namedItem(
                  "slug",
                ) as HTMLInputElement | null;
                if (slugInput && !slugInput.dataset.edited)
                  slugInput.value = slugifyAcademicPost(event.target.value);
              }}
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
            />
          </label>
          <label className="text-sm font-semibold">
            Slug
            <input
              name="slug"
              required
              minLength={2}
              maxLength={100}
              onChange={(event) => {
                event.currentTarget.dataset.edited = "true";
                event.currentTarget.value = slugifyAcademicPost(
                  event.currentTarget.value,
                );
              }}
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm"
            />
          </label>
          <label className="text-sm font-semibold">
            Sort order
            <input
              name="sortOrder"
              type="number"
              defaultValue={0}
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
            />
          </label>
          <label className="md:col-span-2 text-sm font-semibold">
            Description
            <textarea
              name="description"
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 p-3"
            />
          </label>
          <button
            disabled={busyId === "new"}
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-[#002147] px-5 font-bold text-white disabled:opacity-50"
          >
            <Save size={17} aria-hidden="true" />
            Create category
          </button>
        </form>
      )}

      <div className="mt-6">
        {categories.isLoading ? (
          <LoadingState label="Loading post categories" />
        ) : categories.isError ? (
          <ErrorState
            message="Post categories could not be loaded."
            retry={() => void categories.refetch()}
          />
        ) : categories.data?.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {categories.data.map((category) => (
              <form
                key={category.id}
                onSubmit={(event) => void save(category, event)}
                className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2"
              >
                <label className="text-sm font-semibold">
                  Name
                  <input
                    name="name"
                    required
                    defaultValue={category.name}
                    className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
                  />
                </label>
                <label className="text-sm font-semibold">
                  Slug
                  <input
                    name="slug"
                    required
                    defaultValue={category.slug}
                    className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm"
                  />
                </label>
                <label className="text-sm font-semibold">
                  Sort order
                  <input
                    name="sortOrder"
                    type="number"
                    defaultValue={category.sortOrder}
                    className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
                  />
                </label>
                <label className="flex min-h-11 items-center gap-3 self-end text-sm font-semibold">
                  <input
                    name="isActive"
                    type="checkbox"
                    defaultChecked={category.isActive}
                    className="h-5 w-5"
                  />
                  Active
                </label>
                <label className="sm:col-span-2 text-sm font-semibold">
                  Description
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={category.description ?? ""}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-3"
                  />
                </label>
                <button
                  disabled={busyId === category.id}
                  className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-slate-300 px-4 font-bold disabled:opacity-50"
                >
                  <Save size={17} aria-hidden="true" />
                  Save changes
                </button>
              </form>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No post categories"
            message="Create a category before publishing academic posts."
          />
        )}
      </div>
    </main>
  );
}
