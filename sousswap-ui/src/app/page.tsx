"use client";

import { useMemo, useState } from "react";
import {
  Drumstick,
  Droplet,
  Flame,
  Leaf,
  Milk,
  PillBottle,
  Wheat,
} from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";

const DEFAULT_RECIPE = `Spaghetti Aglio e Olio
No two aglio e olio recipes are alike, but this one is pretty true to the classic method. The key is slowly toasting the garlic slices to a perfect golden brown in the olive oil. If it's too light, you don't get the full flavor and if it's too dark it gets bitter. My advice? Do it perfectly.

By John Mitzewich
Prep Time: 10 mins
Cook Time: 15 mins
Total Time: 25 mins
Servings: 4
Ingredients
1 pound uncooked spaghetti

1/2 cup olive oil

6 cloves garlic, thinly sliced

1/4 teaspoon red pepper flakes, or to taste

salt and freshly ground black pepper to taste

1/4 cup chopped fresh Italian parsley

1 cup finely grated Parmigiano-Reggiano cheese

Directions
Gather all ingredients.

Bring a large pot of lightly salted water to a boil. Cook spaghetti in the boiling water, stirring occasionally until cooked through but firm to the bite, about 10 to 12 minutes. Drain and transfer to a pasta bowl.

While the pasta is cooking, combine olive oil and garlic in a cold skillet.

Cook over medium heat to slowly toast garlic, about 10 minutes. Reduce heat to medium-low when olive oil begins to bubble. Cook and stir until garlic is golden brown, about another 5 minutes. Remove from heat.

Stir red pepper flakes, salt, and black pepper into pasta.

Pour in hot olive oil and garlic, and sprinkle on Italian parsley and half of the Parmigiano-Reggiano cheese; toss until combined.

Serve pasta topped with the remaining Parmigiano-Reggiano cheese.

Recipe Tip
It's not traditional, but for extra richness, add 1 tablespoon butter when you toss pasta with cheese.
`;

const BASIC_INGREDIENTS = [
  "olive oil",
  "canola oil",
  "vegetable oil",
  "avocado oil",
  "butter",
  "ghee",
  "lard",
  "coconut oil",
  "sesame oil",
  "peanut oil",
  "sunflower oil",
  "grapeseed oil",
  "flour",
  "all-purpose flour",
  "bread flour",
  "whole wheat flour",
  "cornmeal",
  "cornstarch",
  "baking powder",
  "baking soda",
  "sugar",
  "brown sugar",
  "powdered sugar",
  "honey",
  "maple syrup",
  "molasses",
  "salt",
  "black pepper",
  "white pepper",
  "red pepper flakes",
  "paprika",
  "smoked paprika",
  "cumin",
  "coriander",
  "turmeric",
  "cinnamon",
  "nutmeg",
  "cloves",
  "allspice",
  "oregano",
  "basil",
  "thyme",
  "rosemary",
  "parsley",
  "cilantro",
  "dill",
  "bay leaf",
  "garlic",
  "onion",
  "shallot",
  "scallion",
  "leek",
  "ginger",
  "carrot",
  "celery",
  "bell pepper",
  "jalapeno",
  "tomato",
  "cherry tomato",
  "tomato paste",
  "tomato sauce",
  "crushed tomatoes",
  "potato",
  "sweet potato",
  "zucchini",
  "eggplant",
  "mushroom",
  "spinach",
  "kale",
  "broccoli",
  "cauliflower",
  "cabbage",
  "lettuce",
  "arugula",
  "cucumber",
  "avocado",
  "lemon",
  "lime",
  "orange",
  "apple",
  "banana",
  "strawberry",
  "blueberry",
  "raspberry",
  "grape",
  "pineapple",
  "mango",
  "peach",
  "pear",
  "watermelon",
  "chicken breast",
  "chicken thigh",
  "ground beef",
  "steak",
  "pork chop",
  "bacon",
  "sausage",
  "turkey",
  "ham",
  "salmon",
  "tuna",
  "cod",
  "shrimp",
  "crab",
  "tofu",
  "tempeh",
  "chickpeas",
  "black beans",
  "kidney beans",
  "lentils",
  "peas",
  "quinoa",
  "rice",
  "brown rice",
  "basmati rice",
  "jasmine rice",
  "couscous",
  "bulgur",
  "oats",
  "pasta",
  "spaghetti",
  "linguine",
  "penne",
  "rice noodles",
  "bread",
  "tortilla",
  "pita",
  "breadcrumbs",
  "milk",
  "heavy cream",
  "sour cream",
  "yogurt",
  "buttermilk",
  "cream cheese",
  "mozzarella",
  "cheddar",
  "parmesan",
  "feta",
  "ricotta",
  "egg",
  "egg whites",
  "mayonnaise",
  "mustard",
  "ketchup",
  "soy sauce",
  "tamari",
  "fish sauce",
  "worcestershire sauce",
  "vinegar",
  "apple cider vinegar",
  "balsamic vinegar",
  "rice vinegar",
  "red wine vinegar",
  "white wine",
  "chicken stock",
  "beef stock",
  "vegetable stock",
  "broth",
  "coconut milk",
  "tomato juice",
  "hot sauce",
  "pesto",
  "curry paste",
  "olives",
  "capers",
  "anchovy",
  "pickles",
  "relish",
  "sesame seeds",
  "peanuts",
  "almonds",
  "cashews",
  "walnuts",
  "pecans",
  "sunflower seeds",
  "pumpkin seeds",
  "raisins",
  "cranberries",
  "chocolate chips",
  "cocoa powder",
  "vanilla extract",
  "yeast",
  "baking chocolate",
  "gelatin",
  "cream of tartar",
  "beer",
  "sake",
  "mirin",
  "miso",
  "tahini",
  "chili powder",
  "cayenne pepper",
  "saffron",
  "cardamom",
  "curry powder",
  "garam masala",
  "coriander seeds",
  "fennel seeds",
  "star anise",
  "mustard seeds",
];

const DIET_PROFILES = [
  {
    name: "None",
    instructions: "No additional dietary restrictions.",
  },
  {
    name: "Gluten Free",
    instructions:
      "Avoid all gluten-containing ingredients: wheat, barley, rye, spelt, farro, durum, semolina, bulgur, couscous, farina, malt, brewer's yeast, most soy sauce unless labeled gluten-free. Prefer gluten-free grains and starches (rice, corn, quinoa, buckwheat, certified GF oats). Do not suggest bread/pasta/flour unless explicitly gluten-free.",
  },
  {
    name: "Vegan",
    instructions:
      "Exclude all animal products: meat, poultry, fish/seafood, eggs, dairy, honey, gelatin. Prefer plant proteins (legumes, tofu/tempeh) and plant-based dairy alternatives.",
  },
  {
    name: "Vegetarian",
    instructions:
      "Exclude meat, poultry, fish/seafood, and gelatin. Dairy and eggs are allowed unless otherwise stated.",
  },
  {
    name: "Ketogenic",
    instructions:
      "Minimize carbs and sugars. Avoid grains, pasta, rice, bread, most starchy vegetables, and added sugars. Favor fats, proteins, and low-carb vegetables.",
  },
  {
    name: "Weight loss",
    instructions:
      "Favor lower-calorie, higher-satiety options. Avoid heavy creams, excessive oils/butter, and added sugars. Prefer lean proteins, vegetables, and lighter swaps.",
  },
];

const DEFAULT_ALLOWED = [
  "spaghetti",
  "linguine",
  "garlic",
  "olive oil",
  "chili flakes",
  "parsley",
  "salt",
  "whole wheat pasta",
];

const normalizeIngredient = (value: string) => value.trim().toLowerCase();

const ingredientIcon = (value: string) => {
  const name = normalizeIngredient(value);
  if (name === "salt" || name.includes("salt ")) {
    return PillBottle;
  }
  if (
    name.includes("chicken") ||
    name.includes("beef") ||
    name.includes("pork") ||
    name.includes("turkey") ||
    name.includes("ham") ||
    name.includes("sausage")
  ) {
    return Drumstick;
  }
  if (name.includes("milk") || name.includes("cheese") || name.includes("cream") || name === "yogurt" || name === "butter" || name === "ghee") {
    return Milk;
  }
  if (name.includes("oil") || name.includes("vinegar") || name.includes("sauce") || name.includes("broth") || name.includes("stock")) {
    return Droplet;
  }
  if (
    name.includes("flour") ||
    name.includes("bread") ||
    name.includes("pasta") ||
    name.includes("spaghetti") ||
    name.includes("linguine") ||
    name.includes("noodle") ||
    name.includes("rice") ||
    name.includes("oat")
  ) {
    return Wheat;
  }
  if (
    name.includes("pepper") ||
    name.includes("paprika") ||
    name.includes("chili") ||
    name.includes("cayenne") ||
    name.includes("curry") ||
    name.includes("garam masala")
  ) {
    return Flame;
  }
  return Leaf;
};

export default function Home() {
  const [recipeText, setRecipeText] = useState(DEFAULT_RECIPE);
  const [allowedInput, setAllowedInput] = useState("");
  const [allowedIngredients, setAllowedIngredients] =
    useState<string[]>(DEFAULT_ALLOWED);
  const [dietIndex, setDietIndex] = useState(0);
  const [allowOutOfList, setAllowOutOfList] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedDiet = useMemo(() => DIET_PROFILES[dietIndex], [dietIndex]);
  const suggestions = useMemo(() => {
    const query = normalizeIngredient(allowedInput);
    if (!query) {
      return [];
    }
    const current = new Set(
      allowedIngredients.map((item) => normalizeIngredient(item))
    );
    return BASIC_INGREDIENTS.filter(
      (item) =>
        normalizeIngredient(item).includes(query) &&
        !current.has(normalizeIngredient(item))
    ).slice(0, 8);
  }, [allowedInput, allowedIngredients]);

  const addAllowed = () => {
    const trimmed = allowedInput.trim();
    if (!trimmed) {
      return;
    }
    const normalized = normalizeIngredient(trimmed);
    const exists = allowedIngredients.some(
      (item) => normalizeIngredient(item) === normalized
    );
    if (!exists) {
      setAllowedIngredients([...allowedIngredients, trimmed]);
    }
    setAllowedInput("");
  };

  const addSuggestion = (value: string) => {
    const normalized = normalizeIngredient(value);
    const exists = allowedIngredients.some(
      (item) => normalizeIngredient(item) === normalized
    );
    if (!exists) {
      setAllowedIngredients([...allowedIngredients, value]);
    }
    setAllowedInput("");
  };

  const removeAllowed = (value: string) => {
    setAllowedIngredients(allowedIngredients.filter((item) => item !== value));
  };

  const createSession = async () => {
    setStatus("loading");
    setError(null);
    setSessionId(null);
    try {
      const resp = await fetch(`${API_BASE}/v1/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe_text: recipeText,
          allowed_ingredients: allowedIngredients,
          diet_profile: selectedDiet,
          allow_out_of_list: allowOutOfList,
        }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || "Request failed");
      }
      const data = await resp.json();
      setSessionId(data.session_id ?? null);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-8 py-8 pb-16">
        <header className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-500 shadow-sm">
            Step 1 · Load Recipe & Preferences
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            SousSwap — Ingredient Substitution Setup
          </h1>
          <p className="max-w-2xl text-sm text-zinc-600">
            Paste a recipe and set your ingredient and dietary preferences to
            begin the serialized substitution flow.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Recipe</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Provide a full recipe or paste from a site.
            </p>
            <textarea
              className="mt-4 h-[520px] w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-relaxed outline-none focus:border-zinc-400"
              value={recipeText}
              onChange={(event) => setRecipeText(event.target.value)}
            />
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Preferences</h2>
            <div className="mt-4 space-y-5 text-sm">
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Allowed ingredients
                </label>
                <div className="mt-2 flex gap-2">
                  <div className="relative flex-1">
                    <input
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                      value={allowedInput}
                      onChange={(event) => setAllowedInput(event.target.value)}
                      placeholder="Search or add ingredient"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addAllowed();
                        }
                      }}
                    />
                    {suggestions.length > 0 && (
                      <div className="absolute z-10 mt-2 w-full rounded-lg border border-zinc-200 bg-white shadow-lg">
                        {suggestions.map((item) => (
                          <button
                            key={item}
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50"
                            onClick={() => addSuggestion(item)}
                          >
                            <span className="text-zinc-900">{item}</span>
                            <span className="ml-auto text-xs text-zinc-400">
                              add
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white"
                    onClick={addAllowed}
                  >
                    Add
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {allowedIngredients.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs"
                    >
                      {(() => {
                        const Icon = ingredientIcon(item);
                        return <Icon className="h-3.5 w-3.5 text-zinc-500" />;
                      })()}
                      {item}
                      <button
                        type="button"
                        className="text-zinc-400 hover:text-zinc-900"
                        onClick={() => removeAllowed(item)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Dietary profile
                </label>
                <select
                  className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                  value={dietIndex}
                  onChange={(event) => setDietIndex(Number(event.target.value))}
                >
                  {DIET_PROFILES.map((profile, idx) => (
                    <option key={profile.name} value={idx}>
                      {profile.name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-zinc-500">
                  {selectedDiet.instructions}
                </p>
              </div>

              <label className="flex items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2">
                <input
                  type="checkbox"
                  checked={allowOutOfList}
                  onChange={(event) => setAllowOutOfList(event.target.checked)}
                />
                <span className="text-sm">Allow suggestions outside my list</span>
              </label>
            </div>
          </section>
        </div>

      </div>

      <section className="fixed bottom-0 left-0 right-0 border-t border-zinc-200 bg-white/95 px-8 py-3 shadow-[0_-6px_16px_rgba(0,0,0,0.06)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2">
          <button
            type="button"
            className="w-full rounded-lg bg-zinc-900 px-5 py-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            onClick={createSession}
            disabled={status === "loading"}
          >
            {status === "loading"
              ? "Creating session..."
              : "Start Substitution Flow"}
          </button>
          {status === "done" && sessionId && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Session created: {sessionId}
            </div>
          )}
          {status === "error" && error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}
          <p className="text-xs text-zinc-500">
            This step only creates a session. Stage navigation and suggestions
            will be wired next.
          </p>
        </div>
      </section>
    </div>
  );
}
