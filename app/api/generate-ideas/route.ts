import { NextRequest, NextResponse } from "next/server";
import { generateText, Output } from "ai";
import { getGemini, GEMINI_MODEL, GenerateIdeasInput, IdeasSchema } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const body = GenerateIdeasInput.parse(await req.json());
    const gemini = getGemini();
    const dietLine = body.diets.length ? body.diets.join(", ") : "no restrictions";

    const { output } = await generateText({
      model: gemini(GEMINI_MODEL),
      output: Output.object({ schema: IdeasSchema }),
      prompt: `You are a creative home-cook assistant. Suggest 4 to 6 ${body.cuisine} dish ideas a cook could make using what they have on hand.

Available ingredients: ${body.ingredients.join(", ")}.
Dietary preferences: ${dietLine}.

Rules:
- Rank by how well each dish matches the available ingredients.
- matchPercent reflects the share of the dish's core ingredients the user already has (be honest).
- missingIngredients lists items the user does NOT have but would need (omit common pantry staples like salt, pepper, oil, water).
- Respect ALL dietary preferences strictly.
- Keep descriptions to one appetizing sentence.`,
    });

    return NextResponse.json(output);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
