"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Bookmark, ChefHat, Clock, Gauge, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useFoodzyUser } from "@/lib/auth";
import { useSavedDishes, unsaveDish, type SavedRecipe } from "@/lib/saved";

export default function SavedDishesPage() {
  const router = useRouter();
  const { user, ready } = useFoodzyUser();
  const { items, refresh } = useSavedDishes();
  const [openRecipe, setOpenRecipe] = useState<SavedRecipe | null>(null);

  useEffect(() => {
    if (ready && !user) router.push("/login");
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <Loader2 className="size-6 animate-spin text-brand" />
      </div>
    );
  }

  if (openRecipe) {
    return <SavedRecipeDetail recipe={openRecipe} onBack={() => setOpenRecipe(null)} />;
  }

  return (
    <div className="min-h-screen bg-canvas text-ink/90">
      <nav className="sticky top-0 z-40 border-b border-ink/5 bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <ChefHat className="size-5 text-brand" />
            <span className="font-display text-xl font-semibold tracking-tight text-brand">Foodzy</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-ink/60 hover:text-brand">
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="font-display text-3xl font-medium leading-tight md:text-4xl">Saved dishes</h1>
        <p className="mt-2 text-ink/60">Recipes you've bookmarked to come back to later.</p>

        {items.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-ink/10 bg-surface/50 py-16 text-center">
            <Bookmark className="mx-auto size-8 text-ink/30" />
            <p className="mt-3 font-display text-lg text-ink/60">No saved dishes yet.</p>
            <p className="mt-1 text-sm text-ink/40">
              Open a recipe and tap "Save dish" to find it here later.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((dish) => (
              <div
                key={dish.id}
                className="group flex h-full flex-col rounded-2xl bg-card p-5 text-left ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-brand/30"
              >
                <button type="button" onClick={() => setOpenRecipe(dish)} className="flex-1 text-left">
                  <div className="mb-3 flex items-center justify-between text-xs text-ink/40">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" /> {dish.timeMinutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Gauge className="size-3.5" /> {dish.difficulty}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-medium text-ink group-hover:text-brand">
                    {dish.title}
                  </h3>
                  <p className="mt-2 text-sm text-ink/60">{dish.summary}</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    unsaveDish(dish.title);
                    refresh();
                    toast.success("Removed from saved dishes");
                  }}
                  className="mt-4 flex items-center gap-1.5 self-start text-xs font-medium text-ink/40 transition-colors hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function SavedRecipeDetail({ recipe, onBack }: { recipe: SavedRecipe; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-canvas">
      <nav className="sticky top-0 z-40 border-b border-ink/5 bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
          <ChefHat className="size-5 text-brand" />
          <span className="ml-2 font-display text-xl font-semibold tracking-tight text-brand">Foodzy</span>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <button
          type="button"
          onClick={onBack}
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-ink/60 hover:text-brand"
        >
          <ArrowLeft className="size-4" />
          Back to saved dishes
        </button>

        <article className="rounded-3xl border border-ink/5 bg-card p-8 shadow-sm lg:p-12">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              {recipe.servings} servings
            </span>
            <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-ink/60">
              {recipe.difficulty}
            </span>
          </div>
          <h1 className="font-display text-3xl font-medium leading-tight text-balance md:text-4xl">
            {recipe.title}
          </h1>
          <p className="mt-4 max-w-[60ch] text-pretty text-ink/60">{recipe.summary}</p>

          <div className="mt-12 grid gap-12 md:grid-cols-[1fr_1.4fr]">
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/40">
                Ingredients
              </h4>
              <ul className="space-y-3">
                {recipe.ingredients.map((ing) => (
                  <li
                    key={ing.item}
                    className={"flex items-baseline gap-3 text-sm " + (ing.have ? "" : "text-ink/40")}
                  >
                    <span
                      className={
                        "mt-1.5 inline-block size-1.5 shrink-0 rounded-full " +
                        (ing.have ? "bg-accent" : "bg-brand/60")
                      }
                    />
                    <span className={ing.have ? "" : "line-through"}>
                      {ing.amount} {ing.item}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-10">
                <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/40">
                  Nutrition (per serving)
                </h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-ink/5 pb-2">
                    <dt className="text-ink/60">Protein</dt>
                    <dd className="font-medium">{recipe.nutrition.protein}</dd>
                  </div>
                  <div className="flex justify-between border-b border-ink/5 pb-2">
                    <dt className="text-ink/60">Carbs</dt>
                    <dd className="font-medium">{recipe.nutrition.carbs}</dd>
                  </div>
                  <div className="flex justify-between border-b border-ink/5 pb-2">
                    <dt className="text-ink/60">Fat</dt>
                    <dd className="font-medium">{recipe.nutrition.fat}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/40">Steps</h4>
              <ol className="space-y-5">
                {recipe.steps.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="font-display text-2xl italic text-brand leading-none">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="text-sm leading-relaxed text-ink/80">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
