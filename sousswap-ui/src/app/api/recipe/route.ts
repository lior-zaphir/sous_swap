import { NextResponse } from "next/server";

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

const extractJsonLdBlocks = (html: string) => {
  const blocks: string[] = [];
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    if (match[1]) {
      blocks.push(match[1].trim());
    }
  }
  return blocks;
};

const asArray = (value: JsonValue | undefined) =>
  Array.isArray(value) ? value : value ? [value] : [];

const findRecipeNode = (data: JsonValue): JsonObject | null => {
  if (!data) {
    return null;
  }
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findRecipeNode(item);
      if (found) {
        return found;
      }
    }
    return null;
  }
  if (typeof data === "object") {
    const obj = data as JsonObject;
    const type = obj["@type"];
    if (type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"))) {
      return obj;
    }
    const graph = obj["@graph"];
    if (graph) {
      return findRecipeNode(graph);
    }
  }
  return null;
};

const extractRecipeTextFromJsonLd = (recipe: JsonObject) => {
  const name = recipe.name as string | undefined;
  const description = recipe.description as string | undefined;
  const ingredients = asArray(recipe.recipeIngredient).filter(
    (item) => typeof item === "string"
  ) as string[];
  const instructionsRaw = asArray(recipe.recipeInstructions);
  const instructions: string[] = [];

  instructionsRaw.forEach((item) => {
    if (typeof item === "string") {
      instructions.push(item);
    } else if (typeof item === "object" && item) {
      const text = (item as JsonObject).text;
      if (typeof text === "string") {
        instructions.push(text);
      }
    }
  });

  const parts: string[] = [];
  if (name) {
    parts.push(name);
  }
  if (description) {
    parts.push(description);
  }
  if (ingredients.length > 0) {
    parts.push("Ingredients");
    parts.push(ingredients.join("\n"));
  }
  if (instructions.length > 0) {
    parts.push("Directions");
    parts.push(instructions.join("\n"));
  }
  return parts.join("\n\n").trim();
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "SousSwap/1.0",
      },
    });
    if (!resp.ok) {
      return NextResponse.json(
        { error: "Failed to fetch recipe URL" },
        { status: resp.status }
      );
    }
    const html = await resp.text();
    const blocks = extractJsonLdBlocks(html);
    for (const block of blocks) {
      try {
        const parsed = JSON.parse(block) as JsonValue;
        const recipeNode = findRecipeNode(parsed);
        if (recipeNode) {
          const recipeText = extractRecipeTextFromJsonLd(recipeNode);
          if (recipeText) {
            return NextResponse.json({ recipe_text: recipeText, source: "jsonld" });
          }
        }
      } catch {
        // ignore invalid JSON-LD blocks
      }
    }
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return NextResponse.json({ recipe_text: text, source: "html" });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching recipe URL" },
      { status: 500 }
    );
  }
}
