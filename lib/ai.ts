import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

export const GEMINI_MODEL = "gemini-2.5-flash";

export function getGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY");
  return createGoogleGenerativeAI({ apiKey: key });
}

export const GenerateIdeasInput = z.object({
  ingredients: z.array(z.string().min(1)).min(1).max(40),
  cuisine: z.string().min(1),
  diets: z.array(z.string()).max(10),
});

export const IdeasSchema = z.object({
  ideas: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        matchPercent: z.number().min(0).max(100),
        timeMinutes: z.number().min(1).max(600),
        difficulty: z.enum(["Easy", "Medium", "Hard"]),
        missingIngredients: z.array(z.string()),
      }),
    )
    .min(3)
    .max(6),
});

export const GenerateRecipeInput = z.object({
  title: z.string().min(1),
  cuisine: z.string().min(1),
  ingredients: z.array(z.string().min(1)).min(1),
  diets: z.array(z.string()).max(10),
});

export const RecipeSchema = z.object({
  title: z.string(),
  summary: z.string(),
  timeMinutes: z.number().min(1).max(600),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  servings: z.number().min(1).max(20),
  calories: z.number().min(0).max(5000),
  ingredients: z.array(
    z.object({
      item: z.string(),
      amount: z.string(),
      have: z.boolean(),
    }),
  ),
  steps: z.array(z.string()).min(3).max(15),
  nutrition: z.object({
    protein: z.string(),
    carbs: z.string(),
    fat: z.string(),
  }),
});
