"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import {
  ChefHat,
  Loader2,
  Plus,
  Sparkles,
  X,
  ArrowLeft,
  Clock,
  Gauge,
  Flame,
  LogOut,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useFoodzyUser } from "@/lib/auth";
import { useSavedDishes } from "@/lib/saved";

async function callGenerateIdeasApi(data: { ingredients: string[]; cuisine: string; diets: string[] }) {
  const res = await fetch("/api/generate-ideas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json as { ideas: Idea[] };
}

async function callGenerateRecipeApi(data: {
  title: string;
  cuisine: string;
  ingredients: string[];
  diets: string[];
}) {
  const res = await fetch("/api/generate-recipe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json as Recipe;
}

const CUISINES = [
  { name: "Italian" },
  {
    name: "Indian",
    subStyles: [
      "North Indian",
      "South Indian",
      "Maharashtrian",
      "Lucknowi / Awadhi",
      "Kerala",
      "Bengali",
      "Punjabi",
      "Gujarati",
      "Hyderabadi",
      "Goan",
    ],
  },
  { name: "Chinese" },
  { name: "Mexican" },
  { name: "Korean" },
  { name: "Continental" },
  { name: "Thai" },
  { name: "Japanese" },
] as const;

const DIETS = [
  "Vegetarian",
  "Vegan",
  "Non-vegetarian",
  "Gluten-free",
  "Dairy-free",
  "High-protein",
  "Low-calorie",
] as const;

type Idea = {
  title: string;
  description: string;
  matchPercent: number;
  timeMinutes: number;
  difficulty: "Easy" | "Medium" | "Hard";
  missingIngredients: string[];
};

type Recipe = {
  title: string;
  summary: string;
  timeMinutes: number;
  difficulty: "Easy" | "Medium" | "Hard";
  servings: number;
  calories: number;
  ingredients: { item: string; amount: string; have: boolean }[];
  steps: string[];
  nutrition: { protein: string; carbs: string; fat: string };
};

export default function FoodzyHome() {
  const router = useRouter();
  const { user, ready, logout } = useFoodzyUser();

  useEffect(() => {
    if (ready && !user) {
      router.push("/login");
    }
  }, [ready, user, router]);

  const callGenerateIdeas = callGenerateIdeasApi;
  const callGenerateRecipe = callGenerateRecipeApi;

  const [ingredients, setIngredients] = useState<string[]>([
    "Heirloom Tomatoes",
    "Fresh Basil",
    "Mozzarella",
  ]);
  const [input, setInput] = useState("");
  const [cuisine, setCuisine] = useState<string>("Italian");
  const [subCuisine, setSubCuisine] = useState<string | null>(null);
  const [diets, setDiets] = useState<Set<string>>(new Set(["Vegetarian"]));
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [loadingIdeas, setLoadingIdeas] = useState(false);

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);

  const dietList = useMemo(() => Array.from(diets), [diets]);
  const effectiveCuisine = useMemo(
    () => (subCuisine ? `Indian (${subCuisine})` : cuisine),
    [cuisine, subCuisine],
  );

  function addIngredient(raw: string) {
    const v = raw.trim();
    if (!v) return;
    if (ingredients.some((i) => i.toLowerCase() === v.toLowerCase())) {
      setInput("");
      return;
    }
    setIngredients((prev) => [...prev, v]);
    setInput("");
  }

  function removeIngredient(item: string) {
    setIngredients((prev) => prev.filter((i) => i !== item));
  }

  function toggleDiet(d: string) {
    setDiets((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  }

  function handleInputKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addIngredient(input);
    }
  }

  async function handleGenerate() {
    if (ingredients.length === 0) {
      toast.error("Add at least one ingredient first.");
      return;
    }
    setLoadingIdeas(true);
    setIdeas(null);
    try {
      const result = await callGenerateIdeas({ ingredients, cuisine: effectiveCuisine, diets: dietList });
      setIdeas(result.ideas);
      requestAnimationFrame(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      if (msg.includes("429")) toast.error("Rate limit reached. Try again in a moment.");
      else if (msg.includes("402"))
        toast.error("AI credits exhausted. Add credits to keep cooking.");
      else toast.error("Couldn't generate ideas. Please try again.");
    } finally {
      setLoadingIdeas(false);
    }
  }

  async function openRecipe(idea: Idea) {
    setRecipe(null);
    setLoadingRecipe(true);
    try {
      const result = await callGenerateRecipe({
        title: idea.title,
        cuisine: effectiveCuisine,
        ingredients,
        diets: dietList,
      });
      setRecipe(result);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      toast.error("Couldn't load that recipe. Try another.");
    } finally {
      setLoadingRecipe(false);
    }
  }

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <Loader2 className="size-6 animate-spin text-brand" />
      </div>
    );
  }

  if (recipe || loadingRecipe) {
    return (
      <RecipeView
        recipe={recipe}
        loading={loadingRecipe}
        onBack={() => {
          setRecipe(null);
          setLoadingRecipe(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink/90 selection:bg-brand/10">
      <Nav user={user} onLogout={logout} />

      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* Counter / input */}
        <section className="mb-16">
          <div className="mb-8">
            <h1 className="font-display text-4xl font-medium leading-tight text-balance text-ink md:text-5xl">
              What's on the counter today?
            </h1>
            <p className="mt-3 max-w-[52ch] text-pretty text-ink/60">
              Add the ingredients you have on hand and Foodzy will suggest recipes that minimize
              waste and maximize flavor.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="space-y-8">
              {/* Ingredients */}
              <div className="rounded-2xl bg-surface p-6 ring-1 ring-black/5">
                <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-ink/40">
                  Current Ingredients
                </label>
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((ing) => (
                    <div
                      key={ing}
                      className="flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 ring-1 ring-black/5"
                    >
                      <span className="text-sm font-medium">{ing}</span>
                      <button
                        type="button"
                        onClick={() => removeIngredient(ing)}
                        className="text-ink/40 transition-colors hover:text-brand"
                        aria-label={`Remove ${ing}`}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-1 rounded-lg bg-card px-2 ring-1 ring-black/5">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleInputKey}
                      placeholder="Add another..."
                      className="min-w-[140px] bg-transparent px-2 py-1.5 text-sm placeholder:text-ink/30 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => addIngredient(input)}
                      className="text-ink/40 transition-colors hover:text-brand"
                      aria-label="Add ingredient"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-xs text-ink/40">
                  Press Enter to add. We assume basics like salt, pepper, oil, water.
                </p>
              </div>

              {/* Cuisine */}
              <div>
                <label className="mb-4 block text-xs font-semibold uppercase tracking-wider text-ink/40">
                  Cuisine Style
                </label>
                <div className="flex flex-wrap gap-2">
                  {CUISINES.map((c) => {
                    const active = c.name === cuisine;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => {
                          setCuisine(c.name);
                          setSubCuisine(null);
                        }}
                        className={
                          active
                            ? "rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-sm ring-1 ring-accent"
                            : "rounded-full bg-card px-4 py-2 text-sm font-medium text-ink/70 ring-1 ring-black/5 transition-colors hover:bg-surface"
                        }
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>

                {cuisine === "Indian" && (
                  <div className="mt-4 rounded-xl bg-surface/70 p-4">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink/40">
                      Regional style (optional)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {CUISINES.find((c) => c.name === "Indian")?.subStyles?.map((s) => {
                        const active = s === subCuisine;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSubCuisine(active ? null : s)}
                            className={
                              active
                                ? "rounded-full bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground shadow-sm ring-1 ring-brand"
                                : "rounded-full bg-card px-3 py-1.5 text-xs font-medium text-ink/60 ring-1 ring-black/5 transition-colors hover:bg-surface"
                            }
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar filters */}
            <div className="h-fit rounded-2xl border border-ink/5 bg-card p-6">
              <h3 className="mb-4 font-display text-lg font-medium">Dietary Preferences</h3>
              <div className="space-y-3">
                {DIETS.map((d) => {
                  const on = diets.has(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDiet(d)}
                      className="flex w-full items-center justify-between text-left"
                    >
                      <span className="text-sm text-ink/70">{d}</span>
                      <span
                        className={
                          (on ? "bg-brand" : "bg-ink/10") + " block h-5 w-9 rounded-full p-1 transition-colors"
                        }
                      >
                        <span
                          className={
                            (on ? "translate-x-4" : "translate-x-0") +
                            " block h-3 w-3 rounded-full bg-white transition-transform"
                          }
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loadingIdeas}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 px-3 text-sm font-medium text-brand-foreground shadow-lg shadow-brand/20 ring-1 ring-brand transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingIdeas ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Cooking up ideas...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Generate Ideas
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Results */}
        <section id="results" className="mb-20 scroll-mt-24">
          {loadingIdeas && !ideas && <IdeasSkeleton />}
          {ideas && ideas.length > 0 && (
            <>
              <div className="mb-8 flex items-end justify-between">
                <h2 className="font-display text-2xl font-medium">Recommended for You</h2>
                <span className="text-sm text-ink/40">{ideas.length} matching recipes</span>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {ideas.map((idea) => (
                  <IdeaCard key={idea.title} idea={idea} onOpen={() => openRecipe(idea)} />
                ))}
              </div>
            </>
          )}
          {!loadingIdeas && !ideas && <EmptyState />}
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Nav({
  user,
  onLogout,
}: {
  user?: { email: string; name: string; picture?: string } | null;
  onLogout?: () => void;
}) {
  return (
    <nav className="sticky top-0 z-40 border-b border-ink/5 bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <ChefHat className="size-5 text-brand" />
          <span className="font-display text-xl font-semibold tracking-tight text-brand">
            Foodzy
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/saved"
            className="flex items-center gap-1.5 text-sm font-medium text-ink/60 transition-colors hover:text-brand"
          >
            <Bookmark className="size-4" />
            <span className="hidden sm:inline">Saved</span>
          </Link>
          <span className="hidden text-xs font-medium uppercase tracking-widest text-ink/40 sm:block">
            Smart Kitchen Assistant
          </span>
          {user && (
            <div className="flex items-center gap-2">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="size-7 rounded-full border border-ink/10"
                />
              ) : (
                <div className="flex size-7 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden text-xs text-ink/60 sm:block">{user.email}</span>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sign out"
                  className="rounded-md p-1.5 text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink"
                >
                  <LogOut className="size-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ink/5 bg-surface py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
        <div className="flex flex-col gap-1">
          <span className="font-display text-lg font-semibold text-brand">Foodzy</span>
          <p className="text-xs text-ink/40">Made for the mindful cook.</p>
        </div>
        <p className="text-xs text-ink/40">Powered by Lovable AI</p>
      </div>
    </footer>
  );
}

function IdeaCard({ idea, onOpen }: { idea: Idea; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full flex-col rounded-2xl bg-card p-5 text-left ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-brand/30"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">
          {Math.round(idea.matchPercent)}% Match
        </span>
        <span className="text-xs text-ink/40">
          {idea.timeMinutes} min • {idea.difficulty}
        </span>
      </div>
      <h3 className="font-display text-lg font-medium text-ink group-hover:text-brand">
        {idea.title}
      </h3>
      <p className="mt-2 text-sm text-ink/60">{idea.description}</p>
      {idea.missingIngredients.length > 0 && (
        <p className="mt-4 text-xs text-ink/50">
          <span className="font-semibold text-brand">Missing: </span>
          {idea.missingIngredients.join(", ")}
        </p>
      )}
      <span className="mt-auto pt-4 text-xs font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100">
        View full recipe →
      </span>
    </button>
  );
}

function IdeasSkeleton() {
  return (
    <div>
      <div className="mb-8 h-7 w-56 rounded bg-surface" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl bg-surface ring-1 ring-black/5" />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-ink/10 bg-surface/50 py-16 text-center">
      <ChefHat className="mx-auto size-8 text-ink/30" />
      <p className="mt-3 font-display text-lg text-ink/60">
        Your suggestions will appear here.
      </p>
      <p className="mt-1 text-sm text-ink/40">
        Add a few ingredients above and hit Generate Ideas.
      </p>
    </div>
  );
}

function RecipeView({
  recipe,
  loading,
  onBack,
}: {
  recipe: Recipe | null;
  loading: boolean;
  onBack: () => void;
}) {
  const { isSaved, toggleSave } = useSavedDishes();
  const saved = recipe ? isSaved(recipe.title) : false;

  return (
    <div className="min-h-screen bg-canvas">
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <button
          type="button"
          onClick={onBack}
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-ink/60 hover:text-brand"
        >
          <ArrowLeft className="size-4" />
          Back to ideas
        </button>

        {loading || !recipe ? (
          <div className="space-y-6">
            <div className="h-10 w-2/3 animate-pulse rounded bg-surface" />
            <div className="h-5 w-full animate-pulse rounded bg-surface" />
            <div className="h-5 w-1/2 animate-pulse rounded bg-surface" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-72 animate-pulse rounded-2xl bg-surface" />
              <div className="h-72 animate-pulse rounded-2xl bg-surface" />
            </div>
          </div>
        ) : (
          <article className="rounded-3xl border border-ink/5 bg-card p-8 shadow-sm lg:p-12">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                  {recipe.servings} servings
                </span>
                <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-ink/60">
                  {recipe.difficulty}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  toggleSave(recipe);
                  toast.success(saved ? "Removed from saved dishes" : "Saved! Find it under Saved dishes.");
                }}
                className={
                  saved
                    ? "flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground"
                    : "flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-ink/60 transition-colors hover:bg-surface/70"
                }
              >
                {saved ? <BookmarkCheck className="size-3.5" /> : <Bookmark className="size-3.5" />}
                {saved ? "Saved" : "Save dish"}
              </button>
            </div>
            <h1 className="font-display text-3xl font-medium leading-tight text-balance md:text-4xl">
              {recipe.title}
            </h1>
            <p className="mt-4 max-w-[60ch] text-pretty text-ink/60">{recipe.summary}</p>

            <div className="mt-8 grid grid-cols-3 divide-x divide-ink/5 rounded-2xl bg-surface py-4">
              <Stat icon={<Clock className="size-4" />} label="Time" value={`${recipe.timeMinutes}m`} />
              <Stat icon={<Gauge className="size-4" />} label="Difficulty" value={recipe.difficulty} />
              <Stat
                icon={<Flame className="size-4" />}
                label="Calories"
                value={`${recipe.calories}`}
              />
            </div>

            <div className="mt-12 grid gap-12 md:grid-cols-[1fr_1.4fr]">
              <div>
                <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/40">
                  Ingredients
                </h4>
                <ul className="space-y-3">
                  {recipe.ingredients.map((ing) => (
                    <li
                      key={ing.item}
                      className={
                        "flex items-baseline gap-3 text-sm " +
                        (ing.have ? "" : "text-ink/40")
                      }
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
                      {!ing.have && (
                        <span className="text-[10px] font-medium italic text-brand">(missing)</span>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="mt-10">
                  <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/40">
                    Nutrition (per serving)
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <NutriRow label="Protein" value={recipe.nutrition.protein} />
                    <NutriRow label="Carbs" value={recipe.nutrition.carbs} />
                    <NutriRow label="Fat" value={recipe.nutrition.fat} />
                  </dl>
                </div>
              </div>

              <div>
                <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/40">
                  Steps
                </h4>
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
        )}
      </main>
      <Footer />
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <span className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-ink/40">
        {icon}
        {label}
      </span>
      <span className="font-display text-lg font-medium">{value}</span>
    </div>
  );
}

function NutriRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-ink/5 pb-2">
      <dt className="text-ink/60">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
