/**
 * Helper utilities to map API ingredients to application food data structure
 */

import { Ingredient, Category } from '@/types/api.types';

export interface FoodItem {
  id: string;
  name: string;
  price: number;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  image: string;
  description: string;
}

export interface GroupedIngredients {
  [key: string]: FoodItem[];
}

/**
 * Default nutrition values if not provided by API
 */
const DEFAULT_NUTRITION = {
  calories: 100,
  protein: 5,
  carbs: 15,
  fat: 3,
};

/**
 * Default emoji mappings for ingredients
 */
const INGREDIENT_EMOJIS: Record<string, string> = {
  // Starches
  rice: '🍚',
  quinoa: '🌾',
  potato: '🍠',
  cauliflower: '🥬',
  pasta: '🍝',
  bread: '🍞',
  
  // Proteins
  chicken: '🍗',
  tofu: '🧈',
  salmon: '🐟',
  beef: '🥩',
  egg: '🥚',
  chickpea: '🫘',
  shrimp: '🦐',
  pork: '🥓',
  
  // Vegetables
  broccoli: '🥦',
  spinach: '🥬',
  pepper: '🫑',
  carrot: '🥕',
  tomato: '🍅',
  lettuce: '🥬',
  cucumber: '🥒',
  avocado: '🥑',
  
  // Sauces
  tahini: '🥜',
  pesto: '🌿',
  yogurt: '🥛',
  olive: '🫒',
  soy: '🥫',
};

/**
 * Get emoji for ingredient based on name
 */
export function getIngredientEmoji(ingredientName: string): string {
  const name = ingredientName.toLowerCase();
  
  for (const [key, emoji] of Object.entries(INGREDIENT_EMOJIS)) {
    if (name.includes(key)) {
      return emoji;
    }
  }
  
  // Default emojis based on common patterns
  if (name.includes('rice') || name.includes('grain')) return '🍚';
  if (name.includes('meat') || name.includes('protein')) return '🍖';
  if (name.includes('vegetable') || name.includes('veggie')) return '🥗';
  if (name.includes('sauce') || name.includes('dressing')) return '🥫';
  
  return '🥗'; // Default emoji
}

/**
 * Map API ingredient to FoodItem
 */
export function mapIngredientToFoodItem(ingredient: Ingredient): FoodItem {
  return {
    id: ingredient.id,
    name: ingredient.name,
    price: ingredient.unitPrice,
    nutrition: ingredient.nutrition || DEFAULT_NUTRITION,
    image: ingredient.imageUrl || getIngredientEmoji(ingredient.name),
    description: ingredient.description || `Fresh ${ingredient.name}`,
  };
}

/**
 * Map category kind to UI-friendly key
 */
export function mapCategoryKind(kind: string): string {
  const mapping: Record<string, string> = {
    BASE: 'starch',
    STARCH: 'starch',
    PROTEIN: 'protein',
    VEGETABLE: 'vegetables',
    VEGETABLES: 'vegetables',
    SAUCE: 'sauce',
    DRESSING: 'sauce',
    TOPPING: 'topping',
  };
  
  return mapping[kind.toUpperCase()] || kind.toLowerCase();
}

/**
 * Group ingredients by category
 */
export function groupIngredientsByCategory(
  ingredients: Ingredient[],
  categories: Category[]
): GroupedIngredients {
  const grouped: GroupedIngredients = {};
  
  // Initialize groups
  categories.forEach((category) => {
    const key = mapCategoryKind(category.kind);
    if (!grouped[key]) {
      grouped[key] = [];
    }
  });
  
  // Group ingredients
  ingredients.forEach((ingredient) => {
    const category = categories.find((cat) => cat.id === ingredient.categoryId);
    if (category) {
      const key = mapCategoryKind(category.kind);
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(mapIngredientToFoodItem(ingredient));
    }
  });
  
  return grouped;
}

/**
 * Fetch and prepare food data from API
 */
export async function fetchFoodDataFromAPI(): Promise<GroupedIngredients> {
  try {
    const { categoryService, ingredientService } = await import('@/services');
    
    // Fetch categories and ingredients
    const [categoriesResponse, ingredientsResponse] = await Promise.all([
      categoryService.getAll(),
      ingredientService.getAll(),
    ]);
    
    if (!categoriesResponse.success || !ingredientsResponse.success) {
      throw new Error('Failed to fetch data');
    }
    
    const categories = categoriesResponse.data.filter((cat) => cat.isActive);
    const ingredients = ingredientsResponse.data;
    
    // Group and return
    return groupIngredientsByCategory(ingredients, categories);
  } catch (error) {
    console.error('Error fetching food data from API:', error);
    throw error;
  }
}

/**
 * Get default food data (fallback when API fails)
 */
export function getDefaultFoodData(): GroupedIngredients {
  return {
    starch: [
      {
        id: 'brown-rice',
        name: 'Brown Rice',
        price: 25,
        nutrition: { calories: 150, protein: 3, carbs: 30, fat: 1 },
        image: '🍚',
        description: 'Whole grain, fiber-rich',
      },
      {
        id: 'quinoa',
        name: 'Quinoa',
        price: 35,
        nutrition: { calories: 180, protein: 6, carbs: 32, fat: 2 },
        image: '🌾',
        description: 'Complete protein, gluten-free',
      },
      {
        id: 'sweet-potato',
        name: 'Sweet Potato',
        price: 30,
        nutrition: { calories: 120, protein: 2, carbs: 28, fat: 0 },
        image: '🍠',
        description: 'Rich in vitamins, natural sweetness',
      },
      {
        id: 'cauliflower-rice',
        name: 'Cauliflower Rice',
        price: 28,
        nutrition: { calories: 40, protein: 3, carbs: 8, fat: 0 },
        image: '🥬',
        description: 'Low-carb alternative',
      },
    ],
    protein: [
      {
        id: 'grilled-chicken',
        name: 'Grilled Chicken',
        price: 60,
        nutrition: { calories: 200, protein: 35, carbs: 0, fat: 6 },
        image: '🍗',
        description: 'Lean, high-protein',
      },
      {
        id: 'tofu',
        name: 'Grilled Tofu',
        price: 45,
        nutrition: { calories: 150, protein: 15, carbs: 5, fat: 8 },
        image: '🧈',
        description: 'Plant-based protein',
      },
      {
        id: 'salmon',
        name: 'Grilled Salmon',
        price: 80,
        nutrition: { calories: 250, protein: 30, carbs: 0, fat: 12 },
        image: '🐟',
        description: 'Omega-3 rich',
      },
      {
        id: 'chickpeas',
        name: 'Roasted Chickpeas',
        price: 40,
        nutrition: { calories: 180, protein: 12, carbs: 25, fat: 4 },
        image: '🫘',
        description: 'Fiber and protein',
      },
    ],
    vegetables: [
      {
        id: 'broccoli',
        name: 'Steamed Broccoli',
        price: 20,
        nutrition: { calories: 35, protein: 3, carbs: 7, fat: 0 },
        image: '🥦',
        description: 'Vitamin C powerhouse',
      },
      {
        id: 'spinach',
        name: 'Sautéed Spinach',
        price: 18,
        nutrition: { calories: 25, protein: 3, carbs: 4, fat: 0 },
        image: '🥬',
        description: 'Iron-rich leafy green',
      },
      {
        id: 'bell-peppers',
        name: 'Roasted Bell Peppers',
        price: 22,
        nutrition: { calories: 30, protein: 1, carbs: 7, fat: 0 },
        image: '🫑',
        description: 'Colorful antioxidants',
      },
      {
        id: 'carrots',
        name: 'Honey Glazed Carrots',
        price: 20,
        nutrition: { calories: 45, protein: 1, carbs: 11, fat: 0 },
        image: '🥕',
        description: 'Beta-carotene rich',
      },
    ],
    sauce: [
      {
        id: 'tahini',
        name: 'Tahini Dressing',
        price: 15,
        nutrition: { calories: 80, protein: 3, carbs: 3, fat: 7 },
        image: '🥜',
        description: 'Creamy sesame flavor',
      },
      {
        id: 'pesto',
        name: 'Basil Pesto',
        price: 18,
        nutrition: { calories: 90, protein: 2, carbs: 2, fat: 9 },
        image: '🌿',
        description: 'Fresh herb blend',
      },
      {
        id: 'yogurt',
        name: 'Greek Yogurt Sauce',
        price: 12,
        nutrition: { calories: 40, protein: 4, carbs: 3, fat: 2 },
        image: '🥛',
        description: 'Probiotic-rich',
      },
      {
        id: 'avocado',
        name: 'Avocado Cream',
        price: 20,
        nutrition: { calories: 100, protein: 2, carbs: 4, fat: 9 },
        image: '🥑',
        description: 'Healthy fats',
      },
    ],
  };
}

/**
 * Fetch food data with fallback to default
 */
export async function getFoodData(): Promise<GroupedIngredients> {
  try {
    return await fetchFoodDataFromAPI();
  } catch (error) {
    console.warn('Using default food data as fallback');
    return getDefaultFoodData();
  }
}








