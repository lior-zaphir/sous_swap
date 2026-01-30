"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Drumstick,
  Droplet,
  Flame,
  Leaf,
  Milk,
  PillBottle,
  Wheat,
} from "lucide-react";

const API_BASE = (() => {
  let raw = (process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000").trim();
  if (!raw) {
    return "http://127.0.0.1:8000";
  }
  raw = raw.replace(/^http:\/\/http:\//, "http://");
  raw = raw.replace(/^https:\/\/http:\//, "http://");
  raw = raw.replace(/^http:\/\/https:\//, "https://");
  raw = raw.replace(/^https:\/\/https:\//, "https://");
  if (raw.startsWith("http:/") && !raw.startsWith("http://")) {
    raw = raw.replace(/^http:\//, "http://");
  }
  if (raw.startsWith("https:/") && !raw.startsWith("https://")) {
    raw = raw.replace(/^https:\//, "https://");
  }
  if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
    raw = `http://${raw}`;
  }
  return raw;
})();

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

type PixelPotSize = "sm" | "lg" | "xl";

type SubstitutionOption = {
  substitute: string;
  reason?: string;
  adjustment?: string | null;
  confidence?: string;
  diet_fit?: number;
  dish_fit?: number;
};

const PixelPot = ({ size = "lg" }: { size?: PixelPotSize }) => (
  <div className={`pixel-pot pixel-pot--${size}`}>
    <svg viewBox="0 0 120 100" aria-hidden="true">
      <rect x="28" y="44" width="64" height="38" rx="6" className="pot-body" />
      <rect x="18" y="50" width="12" height="22" rx="4" className="pot-handle" />
      <rect x="90" y="50" width="12" height="22" rx="4" className="pot-handle" />
      <rect x="34" y="38" width="52" height="8" rx="4" className="pot-rim" />
      <g className="pot-spoon">
        <rect x="70" y="8" width="6" height="36" rx="3" />
        <rect x="64" y="34" width="18" height="8" rx="4" />
      </g>
      <circle cx="50" cy="18" r="4" className="pot-bubble" />
      <circle cx="62" cy="12" r="3" className="pot-bubble" />
      <circle cx="74" cy="20" r="3" className="pot-bubble" />
    </svg>
  </div>
);

const isDirectSubstitution = (reason?: string) => {
  if (!reason) {
    return true;
  }
  const lowered = reason.toLowerCase();
  return (
    !lowered.includes("not a direct substitution") &&
    !lowered.includes("isn't a direct substitution")
  );
};

type ReviewItem = {
  stage: string;
  ingredient_name: string;
  role: string;
  importance: string;
  options: SubstitutionOption[];
};

const mergeReviewItems = (prev: ReviewItem[], next: ReviewItem[]) => {
  const seen = new Set(prev.map((item) => `${item.stage}:${item.ingredient_name}`));
  const merged = [...prev];
  next.forEach((item) => {
    const key = `${item.stage}:${item.ingredient_name}`;
    if (!seen.has(key)) {
      merged.push(item);
      seen.add(key);
    }
  });
  return merged;
};

export default function Home() {
  const [recipeText, setRecipeText] = useState(DEFAULT_RECIPE);
  const [allowedInput, setAllowedInput] = useState("");
  const [allowedIngredients, setAllowedIngredients] =
    useState<string[]>(DEFAULT_ALLOWED);
  const [dietIndex, setDietIndex] = useState(0);
  const [allowOutOfList, setAllowOutOfList] = useState(false);
  const [preloadSubstitutions, setPreloadSubstitutions] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState<"setup" | "flow" | "review" | "final">(
    "setup"
  );
  const [parsedRecipe, setParsedRecipe] = useState<{
    title?: string | null;
    servings?: string | null;
    ingredients: Array<{ name: string; quantity?: string | null; unit?: string | null; notes?: string | null }>;
    instructions: string[];
  } | null>(null);
  const [stage, setStage] = useState<string | null>(null);
  const [stageIngredients, setStageIngredients] = useState<
    Array<{ ingredient_name: string; role: string; importance: string }>
  >([]);
  const [batchItems, setBatchItems] = useState<
    Array<{
      ingredient_name: string;
      role: string;
      importance: string;
      options: SubstitutionOption[];
    }>
  >([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [decisions, setDecisions] = useState<
    Record<string, { chosen: string; action: "swap" | "add" }>
  >({});
  const [allDecisions, setAllDecisions] = useState<
    Record<string, { chosen: string; action: "swap" | "add" }>
  >({});
  const [flowStatus, setFlowStatus] = useState<
    "idle" | "loading" | "ready" | "error" | "done"
  >("idle");
  const [flowError, setFlowError] = useState<string | null>(null);
  const [flowInitialized, setFlowInitialized] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [annotatedRecipe, setAnnotatedRecipe] = useState<{
    ingredients: Array<{
      ingredient_name: string;
      role: string;
      stage: string;
      importance: string;
    }>;
  } | null>(null);
  const [stageOrder, setStageOrder] = useState<string[]>([]);
  const [stageIndex, setStageIndex] = useState(0);
  const [precomputedStore, setPrecomputedStore] = useState<
    Record<string, any> | null
  >(null);
  const [healthStatus, setHealthStatus] = useState<
    "idle" | "loading" | "ok" | "error"
  >("idle");
  const [healthMessage, setHealthMessage] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<{
    url: string;
    status?: number;
    error?: string;
  } | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [reviewSelected, setReviewSelected] = useState<string | null>(null);
  const [finalRecipe, setFinalRecipe] = useState<{
    title?: string | null;
    ingredients: Array<{ name: string; quantity?: string | null; unit?: string | null; notes?: string | null }>;
    instructions: string[];
  } | null>(null);

  const selectedDiet = useMemo(() => DIET_PROFILES[dietIndex], [dietIndex]);

  useEffect(() => {
    if (
      screen === "flow" &&
      !flowInitialized &&
      flowStatus === "loading" &&
      precomputedStore &&
      annotatedRecipe &&
      stageOrder.length > 0
    ) {
      setStageFromIndex(0, precomputedStore, annotatedRecipe, stageOrder);
      setFlowInitialized(true);
    }
  }, [
    screen,
    flowInitialized,
    flowStatus,
    precomputedStore,
    annotatedRecipe,
    stageOrder,
  ]);

  useEffect(() => {
    if (
      screen === "flow" &&
      flowStatus === "loading" &&
      precomputedStore &&
      batchItems.length > 0
    ) {
      setFlowStatus("ready");
    }
  }, [screen, flowStatus, precomputedStore, batchItems.length]);
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

  const buildBatchItems = (
    ingredients: Array<{
      ingredient_name: string;
      role: string;
      importance: string;
    }>,
    batch: { items: Array<{ ingredient_name: string; options: SubstitutionOption[] }> }
  ) => {
    const items = batch.items ?? [];
    const itemMap = new Map(
      items.map((item) => [item.ingredient_name.toLowerCase(), item])
    );
    return ingredients.map((ing) => {
      const found = itemMap.get(ing.ingredient_name.toLowerCase());
      return {
        ingredient_name: ing.ingredient_name,
        role: ing.role,
        importance: ing.importance,
        options: found?.options ?? [],
      };
    });
  };

  const buildReviewItems = (
    precomputed: Record<string, any>,
    annotated: {
      ingredients: Array<{
        ingredient_name: string;
        role: string;
        stage: string;
        importance: string;
      }>;
    },
    order: string[]
  ): ReviewItem[] => {
    const output: ReviewItem[] = [];
    order.forEach((stageName) => {
      const ingredients = annotated.ingredients.filter(
        (item) => item.stage === stageName
      );
      const batch = precomputed?.[stageName]
        ? { items: precomputed[stageName].items }
        : { items: [] };
      const items = buildBatchItems(ingredients, batch);
      items.forEach((item) => {
        output.push({ ...item, stage: stageName });
      });
    });
    return output;
  };

  const setStageFromIndex = (
    index: number,
    precomputed: Record<string, any>,
    annotatedOverride?: {
      ingredients: Array<{
        ingredient_name: string;
        role: string;
        stage: string;
        importance: string;
      }>;
    } | null,
    stageOrderOverride?: string[]
  ) => {
    const order = stageOrderOverride ?? stageOrder;
    const nextStage = order[index];
    const annotated = annotatedOverride ?? annotatedRecipe;
    if (!nextStage || !annotated) {
      setStage(null);
      setStageIngredients([]);
      setBatchItems([]);
      setFlowStatus("done");
      return;
    }
    const ingredients = annotated.ingredients.filter(
      (item) => item.stage === nextStage
    );
    setStage(nextStage);
    setStageIndex(index);
    setStageIngredients(ingredients);
    const batch = precomputed?.[nextStage]
      ? { items: precomputed[nextStage].items }
      : { items: [] };
    const stageItems = buildBatchItems(ingredients, batch);
    setBatchItems(stageItems);
    setReviewItems((prev) =>
      mergeReviewItems(
        prev,
        stageItems.map((item) => ({ ...item, stage: nextStage }))
      )
    );
    setCurrentIndex(0);
    setDecisions({});
    setFlowStatus("ready");
  };

  const createSession = async () => {
    setStatus("loading");
    setError(null);
    setLastRequest(null);
    setSessionId(null);
    setStage(null);
    setStageIngredients([]);
    setBatchItems([]);
    setCurrentIndex(0);
    setDecisions({});
    setAllDecisions({});
    setFlowStatus("loading");
    setFlowError(null);
    setFlowInitialized(false);
    setFinalizing(false);
    setParsedRecipe(null);
    setFinalRecipe(null);
    setAnnotatedRecipe(null);
    setStageOrder([]);
    setStageIndex(0);
    setPrecomputedStore(null);
    setReviewItems([]);
    setReviewSelected(null);
    try {
      await checkHealth();
      const resp = await fetch(`${API_BASE}/v1/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe_text: recipeText,
          allowed_ingredients: allowedIngredients,
          diet_profile: selectedDiet,
          allow_out_of_list: allowOutOfList,
          preload_substitutions: preloadSubstitutions,
        }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        setLastRequest({
          url: `${API_BASE}/v1/sessions`,
          status: resp.status,
          error: text || "Request failed",
        });
        throw new Error(text || "Request failed");
      }
      const data = await resp.json();
      setSessionId(data.session_id ?? null);
      setStatus("done");
      setParsedRecipe(data.parsed_recipe ?? null);
      setAnnotatedRecipe(data.annotated_recipe ?? null);
      setStageOrder(data.stage_order ?? []);
      setStageIndex(0);
      setPrecomputedStore(data.precomputed_substitutions ?? null);
      setScreen("flow");
      if (data.precomputed_substitutions && data.stage_order?.length) {
        setStageFromIndex(
          0,
          data.precomputed_substitutions,
          data.annotated_recipe,
          data.stage_order
        );
      } else {
        await loadStageAndSuggestions(
          data.session_id ?? null,
          data.precomputed_substitutions ?? null
        );
      }
    } catch (err) {
      setLastRequest({
        url: `${API_BASE}/v1/sessions`,
        error: err instanceof Error ? err.message : "Unknown error",
      });
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error");
      setFlowStatus("error");
      setFlowError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const checkHealth = async () => {
    setHealthStatus("loading");
    setHealthMessage(null);
    try {
      const resp = await fetch(`${API_BASE}/health`);
      if (!resp.ok) {
        const text = await resp.text();
        setHealthStatus("error");
        setHealthMessage(text || `Health check failed (${resp.status})`);
        return;
      }
      setHealthStatus("ok");
      setHealthMessage("Backend reachable");
    } catch (err) {
      setHealthStatus("error");
      setHealthMessage(err instanceof Error ? err.message : "Health check failed");
    }
  };

  const loadStageAndSuggestions = async (
    id: string | null,
    precomputed: Record<string, any> | null = null
  ) => {
    if (!id) {
      return;
    }
    setFlowStatus("loading");
    setFlowError(null);
    try {
      const resp = await fetch(`${API_BASE}/v1/sessions/${id}/stage`);
      if (resp.status === 404) {
        setStage(null);
        setStageIngredients([]);
        setBatchItems([]);
        setFlowStatus("done");
        return;
      }
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || "Stage request failed");
      }
      const data = await resp.json();
      setStage(data.stage ?? null);
      const ingredients = data.ingredients ?? [];
      setStageIngredients(ingredients);
      if (stageOrder.length > 0) {
        const idx = stageOrder.indexOf(data.stage ?? "");
        if (idx >= 0) {
          setStageIndex(idx);
        }
      }

      const subsData = precomputed?.[data.stage]
        ? { batch: precomputed[data.stage] }
        : await (async () => {
            const subsResp = await fetch(
              `${API_BASE}/v1/sessions/${id}/substitutions`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stage: data.stage }),
              }
            );
            if (!subsResp.ok) {
              const text = await subsResp.text();
              throw new Error(text || "Substitution request failed");
            }
            return subsResp.json();
          })();
      const ordered = buildBatchItems(
        ingredients,
        subsData?.batch ?? { items: [] }
      );
      setBatchItems(ordered);
      if (data.stage) {
        setReviewItems((prev) =>
          mergeReviewItems(
            prev,
            ordered.map((item) => ({ ...item, stage: data.stage }))
          )
        );
      }
      if (!precomputedStore && data.stage) {
        setReviewItems((prev) => {
          if (prev.some((item) => item.stage === data.stage)) {
            return prev;
          }
          return [
            ...prev,
            ...ordered.map((item) => ({ ...item, stage: data.stage })),
          ];
        });
      }
      setCurrentIndex(0);
      setDecisions({});
      setFlowStatus("ready");
    } catch (err) {
      setFlowStatus("error");
      setFlowError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const applyChoice = (action: "swap" | "add" | "keep", option?: string) => {
    const current = batchItems[currentIndex];
    if (!current) {
      return;
    }
    const key = current.ingredient_name;
    if (action === "keep") {
      setDecisions((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setAllDecisions((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } else if (option) {
      setDecisions((prev) => ({
        ...prev,
        [key]: { chosen: option, action },
      }));
      setAllDecisions((prev) => ({
        ...prev,
        [key]: { chosen: option, action },
      }));
    }
    if (currentIndex < batchItems.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      void submitStageChoices();
    }
  };

  const applyReviewDecision = (
    item: ReviewItem,
    action: "swap" | "add" | "keep",
    option?: string
  ) => {
    const key = item.ingredient_name;
    if (action === "keep") {
      setAllDecisions((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }
    if (option) {
      setAllDecisions((prev) => ({
        ...prev,
        [key]: { chosen: option, action },
      }));
    }
  };

  const submitStageChoices = async () => {
    if (!sessionId) {
      return;
    }
    setFlowStatus("loading");
    setFlowError(null);
    try {
      const swaps = Object.entries(decisions).map(([original, value]) => ({
        original,
        chosen: value.chosen,
        action: value.action,
      }));
      const resp = await fetch(`${API_BASE}/v1/sessions/${sessionId}/swaps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ swaps }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || "Apply swaps failed");
      }
      if (stageOrder.length > 0 && stageIndex + 1 >= stageOrder.length) {
        if (precomputedStore && annotatedRecipe) {
          setReviewItems(
            buildReviewItems(precomputedStore, annotatedRecipe, stageOrder)
          );
        }
        setScreen("review");
        setFlowStatus("ready");
        return;
      }
      if (precomputedStore && stageOrder.length > 0) {
        setStageFromIndex(stageIndex + 1, precomputedStore, null, stageOrder);
      } else {
        await loadStageAndSuggestions(sessionId, precomputedStore);
      }
    } catch (err) {
      setFlowStatus("error");
      setFlowError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const finalizeRecipe = async () => {
    if (!sessionId) {
      return;
    }
    setFinalizing(true);
    setFlowStatus("loading");
    setFlowError(null);
    try {
      const swaps = Object.entries(allDecisions).map(([original, value]) => ({
        original,
        chosen: value.chosen,
        action: value.action,
      }));
      const resp = await fetch(
        `${API_BASE}/v1/sessions/${sessionId}/finalize`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ swaps }),
        }
      );
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || "Finalize failed");
      }
      const data = await resp.json();
      setFinalRecipe(data.current_recipe ?? null);
      setFinalizing(false);
      setFlowStatus("done");
      setScreen("final");
    } catch (err) {
      setFinalizing(false);
      setFlowStatus("error");
      setFlowError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const stageLabel = (value: string | null) => {
    if (!value) {
      return "Ingredients";
    }
    if (value === "primary") {
      return "Primary Ingredients";
    }
    if (value === "secondary") {
      return "Secondary Ingredients";
    }
    return "Seasoning / Optional";
  };

  const selectedReviewItem = reviewSelected
    ? reviewItems.find((item) => item.ingredient_name === reviewSelected)
    : null;

  const originalIngredientNames = useMemo(() => {
    const names = parsedRecipe?.ingredients ?? [];
    return new Set(names.map((item) => normalizeIngredient(item.name)));
  }, [parsedRecipe]);

  const isNewIngredient = (name: string) =>
    !originalIngredientNames.has(normalizeIngredient(name));

  return (
    <>
      <div className="flex min-h-screen flex-col bg-[#f7f5f1] text-[#1f2933]">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-8 py-8 pb-16">
        <header className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e6e2da] bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
            {screen === "setup"
              ? "Step 1 · Load Recipe & Preferences"
              : "Step 2 · Ingredient Substitutions"}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {screen === "setup"
              ? "SousSwap — Ingredient Substitution Setup"
              : "SousSwap — Guided Ingredient Swaps"}
          </h1>
          <p className="max-w-2xl text-sm text-slate-600">
            {screen === "setup"
              ? "Paste a recipe and set your ingredient and dietary preferences to begin the serialized substitution flow."
              : "Review each ingredient in order and decide whether to keep it, swap it, or add a complementary option."}
          </p>
        </header>

        {screen === "setup" ? (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-2xl border border-[#e6e2da] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <h2 className="text-lg font-semibold">Recipe</h2>
              <p className="mt-1 text-sm text-slate-500">
                Provide a full recipe or paste from a site.
              </p>
              <textarea
                className="mt-4 h-[520px] w-full resize-none rounded-xl border border-[#e6e2da] bg-[#faf9f6] p-4 text-sm leading-relaxed outline-none focus:border-emerald-500"
                value={recipeText}
                onChange={(event) => setRecipeText(event.target.value)}
              />
            </section>

            <section className="rounded-2xl border border-[#e6e2da] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <h2 className="text-lg font-semibold">Preferences</h2>
              <div className="mt-4 space-y-5 text-sm">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Allowed ingredients
                  </label>
                  <div className="mt-2 flex gap-2">
                    <div className="relative flex-1">
                      <input
                        className="w-full rounded-lg border border-[#e6e2da] bg-[#faf9f6] px-3 py-2 text-sm outline-none focus:border-emerald-500"
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
                        <div className="absolute z-10 mt-2 w-full rounded-lg border border-[#e6e2da] bg-white shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
                          {suggestions.map((item) => (
                            <button
                              key={item}
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#f3f2ee]"
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
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                      onClick={addAllowed}
                    >
                      Add
                    </button>
        </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {allowedIngredients.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-2 rounded-full border border-[#e6e2da] bg-[#f7f5f1] px-3 py-1 text-xs"
                      >
                        {(() => {
                          const Icon = ingredientIcon(item);
                          return <Icon className="h-3.5 w-3.5 text-slate-500" />;
                        })()}
                        {item}
                        <button
                          type="button"
                          className="text-slate-400 hover:text-slate-900"
                          onClick={() => removeAllowed(item)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
        </div>

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Dietary profile
                  </label>
                  <select
                    className="mt-2 w-full rounded-lg border border-[#e6e2da] bg-[#faf9f6] px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    value={dietIndex}
                    onChange={(event) =>
                      setDietIndex(Number(event.target.value))
                    }
                  >
                    {DIET_PROFILES.map((profile, idx) => (
                      <option key={profile.name} value={idx}>
                        {profile.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-slate-500">
                    {selectedDiet.instructions}
                  </p>
                </div>

                <label className="flex items-center gap-3 rounded-lg border border-[#e6e2da] bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={allowOutOfList}
                    onChange={(event) =>
                      setAllowOutOfList(event.target.checked)
                    }
                  />
                  <span className="text-sm">
                    Allow suggestions outside my list
                  </span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-[#e6e2da] bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={preloadSubstitutions}
                    onChange={(event) =>
                      setPreloadSubstitutions(event.target.checked)
                    }
                  />
                  <span className="text-sm">
                    Precompute all suggestions up front (slower start, faster flow)
                  </span>
                </label>
              </div>
            </section>
          </div>
        ) : screen === "flow" ? (
          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border border-[#e6e2da] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between">
                <div>
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Stage
                  </div>
                  <h2 className="mt-2 text-xl font-semibold">
                    {stageLabel(stage)}
                  </h2>
                </div>
              <div className="text-xs text-slate-500">
                  {flowStatus === "ready" && batchItems.length > 0
                    ? `Ingredient ${currentIndex + 1} of ${batchItems.length}`
                    : ""}
                </div>
                {precomputedStore && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700">
                    Preloaded
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {flowStatus === "loading" && (
                  <div className="flex items-center gap-3 text-sm text-zinc-500">
                    <PixelPot size="sm" />
                    {finalizing
                      ? "Finalizing recipe rewrite..."
                      : "Loading stage suggestions..."}
                  </div>
                )}
                {flowStatus === "error" && (
                  <span className="text-sm text-rose-600">
                    {flowError ?? "Unable to load this stage."}
                  </span>
                )}
                {flowStatus === "done" && (
                  <span className="text-sm text-emerald-600">
                    All stages complete. Recipe rewrite is ready.
                  </span>
                )}
                {flowStatus === "ready" &&
                  batchItems.map((item, idx) => {
                    const isCurrent = idx === currentIndex;
                    const hasDecision = Boolean(
                      decisions[item.ingredient_name]
                    );
                    return (
                      <button
                        key={`${item.ingredient_name}-${idx}`}
                        type="button"
                        onClick={() => setCurrentIndex(idx)}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${
                          isCurrent
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : hasDecision
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-zinc-200 bg-zinc-50 text-zinc-700"
                        }`}
                      >
                        {item.ingredient_name}
                      </button>
                    );
                  })}
        </div>
            </div>

            <div className="rounded-2xl border border-[#e6e2da] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              {flowStatus === "loading" ? (
                  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[#e6e2da] bg-[#f7f5f1] p-10 text-sm text-slate-500">
                  <div className="flex flex-col items-center gap-3">
                    <PixelPot size="lg" />
                    {finalizing
                      ? "Rewriting the final recipe..."
                      : "Fetching the next batch of ingredients..."}
                  </div>
                </div>
              ) : flowStatus === "ready" && batchItems[currentIndex] ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {batchItems[currentIndex].ingredient_name}
                      </h3>
                      <p className="mt-1 text-xs text-zinc-500">
                        {batchItems[currentIndex].role} ·{" "}
                        {batchItems[currentIndex].importance}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700"
                      onClick={() => applyChoice("keep")}
                    >
                      Keep
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {batchItems[currentIndex].options.length === 0 && (
                      <div className="rounded-lg border border-dashed border-[#e6e2da] bg-[#f7f5f1] p-4 text-sm text-slate-500">
                        No alternatives suggested. Keep the original ingredient.
                      </div>
                    )}
                    {batchItems[currentIndex].options
                      .filter(
                        (opt) =>
                          opt.substitute.toLowerCase() !==
                          batchItems[currentIndex].ingredient_name.toLowerCase() &&
                          isDirectSubstitution(opt.reason)
                      )
                      .map((opt) => (
                      <div
                        key={opt.substitute}
                        className="rounded-xl border border-[#e6e2da] bg-white p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-zinc-900">
                              {opt.substitute}
                            </div>
                            {opt.reason && (
                              <p className="mt-1 text-xs text-zinc-500">
                                {opt.reason}
                              </p>
                            )}
                            {opt.adjustment && (
                              <p className="mt-2 text-xs text-zinc-500">
                                Adjustment: {opt.adjustment}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                                <button
                                  type="button"
                                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                              onClick={() =>
                                applyChoice("swap", opt.substitute)
                              }
                            >
                              Swap
                            </button>
                                <button
                                  type="button"
                                  className="rounded-lg border border-[#e6e2da] px-3 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-400"
                              onClick={() =>
                                applyChoice("add", opt.substitute)
                              }
                            >
                              Add
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-3 text-[11px] text-zinc-500">
                          {opt.diet_fit !== undefined &&
                            opt.dish_fit !== undefined && (
                              <span>
                                Diet {opt.diet_fit}/5 · Dish {opt.dish_fit}/5
                              </span>
                            )}
                          {opt.confidence && <span>{opt.confidence}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-sm text-zinc-500">
                  Start the flow to see ingredient suggestions.
                </div>
              )}
            </div>
          </section>
        ) : screen === "review" ? (
          <>
            <section className="grid gap-6 lg:grid-cols-[0.6fr_0.9fr]">
              <div className="rounded-2xl border border-[#e6e2da] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Review your choices</h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      Tap any ingredient to revisit its alternatives.
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-4">
                  {reviewItems.length === 0 && (
                    <div className="text-sm text-zinc-500">
                      No ingredients available for review.
                    </div>
                  )}
                  {reviewItems.map((item, idx) => {
                    const previousStage = reviewItems[idx - 1]?.stage;
                    const decision = allDecisions[item.ingredient_name];
                    const bubbleText = decision
                      ? decision.action === "add"
                        ? `${item.ingredient_name} + ${decision.chosen}`
                        : decision.chosen
                      : item.ingredient_name;
                    return (
                      <div key={`${item.stage}-${item.ingredient_name}`}>
                      {item.stage !== previousStage && (
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            {stageLabel(item.stage)}
                          </div>
                        )}
                        <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-slate-900">
                            {item.ingredient_name}
                          </div>
                          <button
                            type="button"
                            onClick={() => setReviewSelected(item.ingredient_name)}
                            className={`rounded-full border px-3 py-1 text-xs ${
                              decision
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-[#e6e2da] bg-white text-slate-700"
                            }`}
                          >
                            {bubbleText}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="rounded-2xl border border-[#e6e2da] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                  {selectedReviewItem ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {selectedReviewItem.ingredient_name}
                          </h3>
                        <p className="mt-1 text-xs text-slate-500">
                            {selectedReviewItem.role} ·{" "}
                            {selectedReviewItem.importance}
                          </p>
                        </div>
                        <button
                          type="button"
                        className="rounded-lg border border-[#e6e2da] px-3 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-400"
                          onClick={() =>
                            applyReviewDecision(selectedReviewItem, "keep")
                          }
                        >
                          Keep
                        </button>
                      </div>
                      <div className="mt-4 space-y-3">
                        {selectedReviewItem.options
                          .filter(
                            (opt) =>
                              opt.substitute.toLowerCase() !==
                                selectedReviewItem.ingredient_name.toLowerCase() &&
                              isDirectSubstitution(opt.reason)
                          )
                          .map((opt) => (
                          <div
                            key={opt.substitute}
                            className="rounded-xl border border-[#e6e2da] bg-white p-4"
                          >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-semibold text-zinc-900">
                                    {opt.substitute}
                                  </div>
                                  {opt.reason && (
                                  <p className="mt-1 text-xs text-slate-500">
                                      {opt.reason}
                                    </p>
                                  )}
                                  {opt.adjustment && (
                                  <p className="mt-2 text-xs text-slate-500">
                                      Adjustment: {opt.adjustment}
                                    </p>
                                  )}
                                </div>
                                <div className="flex flex-col gap-2">
                                  <button
                                    type="button"
                                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                                    onClick={() =>
                                      applyReviewDecision(
                                        selectedReviewItem,
                                        "swap",
                                        opt.substitute
                                      )
                                    }
                                  >
                                    Swap
                                  </button>
                                  <button
                                    type="button"
                                  className="rounded-lg border border-[#e6e2da] px-3 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-400"
                                    onClick={() =>
                                      applyReviewDecision(
                                        selectedReviewItem,
                                        "add",
                                        opt.substitute
                                      )
                                    }
                                  >
                                    Add
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-zinc-500">
                      Select an ingredient to review its alternatives.
                    </div>
                  )}
                </div>
              </div>
            </section>

            <div className="flex justify-center">
              <button
                type="button"
                className="w-full max-w-2xl rounded-lg bg-emerald-600 px-6 py-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={finalizeRecipe}
                disabled={finalizing}
              >
                {finalizing ? "Finalizing..." : "Finalize Recipe"}
              </button>
            </div>
            {finalizing && (
              <div className="flex items-center justify-center pt-4">
                <PixelPot size="xl" />
              </div>
            )}
          </>
        ) : (
          <section className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
            <div className="rounded-2xl border border-[#e6e2da] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <h2 className="text-lg font-semibold">Final Recipe</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Review the updated ingredients and instructions.
              </p>
              <div className="mt-4 space-y-3 text-sm">
                {(finalRecipe?.title || parsedRecipe?.title) && (
                  <div className="text-base font-semibold text-zinc-900">
                    {finalRecipe?.title || parsedRecipe?.title}
                  </div>
                )}
                {parsedRecipe?.servings && (
                  <div className="text-xs text-zinc-500">
                    Servings: {parsedRecipe.servings}
                  </div>
                )}
                <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Ingredients
                </div>
                <div className="space-y-2">
                  {(finalRecipe?.ingredients ?? []).map((ing) => {
                    const q = ing.quantity ? `${ing.quantity} ` : "";
                    const u = ing.unit ? `${ing.unit} ` : "";
                    const n = ing.notes ? `, ${ing.notes}` : "";
                    const isNew = isNewIngredient(ing.name);
                    return (
                      <div
                        key={`${ing.name}-${q}-${u}-${n}`}
                        className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2"
                      >
                        <div className="text-sm text-zinc-900">
                          {`${q}${u}${ing.name}${n}`.trim()}
                        </div>
                        {isNew && (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                            New
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e6e2da] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <h3 className="text-base font-semibold text-zinc-900">
                Instructions
              </h3>
              <div className="mt-4 space-y-3 text-sm text-zinc-700">
                {(finalRecipe?.instructions ?? []).map((step, idx) => (
                  <div key={`${idx}-${step}`} className="flex gap-3">
                    <div className="text-xs font-semibold text-zinc-400">
                      {idx + 1}.
                    </div>
                    <div>{step}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      </div>

        {screen === "setup" && (
          <section className="fixed bottom-0 left-0 right-0 border-t border-zinc-200 bg-white/95 px-8 py-3 shadow-[0_-6px_16px_rgba(0,0,0,0.06)] backdrop-blur">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-2">
              <button
                type="button"
                className="w-full rounded-lg bg-emerald-600 px-5 py-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
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
                  <div>{error}</div>
                  <div className="mt-1 text-xs text-rose-700">
                    API base: {API_BASE}
                  </div>
                  {lastRequest && (
                    <div className="mt-1 text-xs text-rose-700">
                      Request: {lastRequest.url}
                      {lastRequest.status
                        ? ` (${lastRequest.status})`
                        : ""}
                      {lastRequest.error ? ` — ${lastRequest.error}` : ""}
                    </div>
                  )}
                </div>
              )}
              {status === "loading" && (
                <div className="flex items-center justify-center pb-1">
                  <PixelPot size="xl" />
                </div>
              )}
              <p className="text-xs text-zinc-500">
                This step only creates a session. Stage navigation and
                suggestions will be wired next.
              </p>
              <div className="text-[11px] text-zinc-400">
                Health check:{" "}
                {healthStatus === "idle" && "not run"}
                {healthStatus === "loading" && "checking..."}
                {healthStatus === "ok" && "ok"}
                {healthStatus === "error" && `failed (${healthMessage})`}
              </div>
            </div>
          </section>
        )}
    </div>
      <style jsx global>{`
      .pixel-pot {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        image-rendering: pixelated;
      }

      .pixel-pot svg {
        display: block;
        width: 56px;
        height: 46px;
      }

      .pixel-pot--sm svg {
        width: 38px;
        height: 32px;
      }

      .pixel-pot--lg svg {
        width: 72px;
        height: 60px;
      }

      .pixel-pot--xl svg {
        width: 96px;
        height: 80px;
      }

      .pixel-pot svg .pot-body {
        fill: #f4f4f5;
        stroke: #3f3f46;
        stroke-width: 4px;
      }

      .pixel-pot svg .pot-handle {
        fill: #f4f4f5;
        stroke: #3f3f46;
        stroke-width: 4px;
      }

      .pixel-pot svg .pot-rim {
        fill: #e4e4e7;
        stroke: #3f3f46;
        stroke-width: 4px;
      }

      .pixel-pot svg .pot-spoon rect {
        fill: #3f3f46;
      }

      .pixel-pot svg .pot-bubble {
        fill: #e4e4e7;
        stroke: #3f3f46;
        stroke-width: 3px;
        animation: pot-bubble 1.6s ease-in-out infinite;
      }

      .pixel-pot svg .pot-bubble:nth-of-type(2) {
        animation-delay: 0.3s;
      }

      .pixel-pot svg .pot-bubble:nth-of-type(3) {
        animation-delay: 0.6s;
      }

      .pixel-pot svg .pot-spoon {
        transform-origin: 72px 44px;
        animation: pot-stir 1.4s ease-in-out infinite;
      }

      @keyframes pot-stir {
        0% {
          transform: rotate(15deg);
        }
        50% {
          transform: rotate(-25deg);
        }
        100% {
          transform: rotate(15deg);
        }
      }

      @keyframes pot-bubble {
        0%,
        100% {
          transform: translateY(0);
          opacity: 0.6;
        }
        50% {
          transform: translateY(-6px);
          opacity: 1;
        }
      }
    `}</style>
    </>
  );
}
