"use client";

import { useEffect, useState, useCallback } from "react";

export type SavedRecipe = {
  id: string;
  savedAt: number;
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

const STORAGE_KEY = "foodzy.saved-dishes";

function readAll(): SavedRecipe[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedRecipe[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: SavedRecipe[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getSavedDishes(): SavedRecipe[] {
  return readAll().sort((a, b) => b.savedAt - a.savedAt);
}

export function isDishSaved(title: string): boolean {
  return readAll().some((d) => d.title === title);
}

export function saveDish(recipe: Omit<SavedRecipe, "id" | "savedAt">): SavedRecipe {
  const items = readAll();
  const existing = items.find((d) => d.title === recipe.title);
  if (existing) return existing;
  const entry: SavedRecipe = { ...recipe, id: crypto.randomUUID(), savedAt: Date.now() };
  writeAll([...items, entry]);
  return entry;
}

export function unsaveDish(title: string) {
  writeAll(readAll().filter((d) => d.title !== title));
}

/** Reactive hook for components that need the saved list / save state. */
export function useSavedDishes() {
  const [items, setItems] = useState<SavedRecipe[]>([]);

  const refresh = useCallback(() => setItems(getSavedDishes()), []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleSave = useCallback(
    (recipe: Omit<SavedRecipe, "id" | "savedAt">) => {
      if (isDishSaved(recipe.title)) {
        unsaveDish(recipe.title);
      } else {
        saveDish(recipe);
      }
      refresh();
    },
    [refresh],
  );

  return { items, refresh, toggleSave, isSaved: isDishSaved };
}
