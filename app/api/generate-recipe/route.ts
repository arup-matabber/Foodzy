import { NextRequest, NextResponse } from "next/server";
import { generateText, Output } from "ai";
import { getGemini, GEMINI_MODEL, GenerateRecipeInput, RecipeSchema } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const body = GenerateRecipeInput.parse(await req.json());
    const gemini = getGemini();
    const dietLine = body.diets.length ? body.diets.join(", ") : "no restrictions";

    const { output } = await generateText({
      model: gemini(GEMINI_MODEL),
      output: Output.object({ schema: RecipeSchema }),
      prompt: `Write a complete recipe for "${body.title}" (${body.cuisine} cuisine).

The cook has these ingredients on hand: ${body.ingredients.join(", ")}.
Dietary preferences (must respect): ${dietLine}.

For each ingredient in the recipe:
- Set "have": true if the user already has it on hand (case-insensitive match).
- Set "have": false if it's missing.

Provide 4-10 clear, numbered cooking steps (one per array entry, no leading number).
Estimate per-serving nutrition.
Keep summary to one appetizing sentence.`,
    });

    return NextResponse.json(output);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
