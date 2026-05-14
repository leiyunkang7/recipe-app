import { defineEventHandler } from 'h3';
import { NUTRITION_DATABASE, UNIT_TO_GRAMS } from '@recipe-app/nutrition';

export default defineEventHandler(async () => {
  const ingredients = Object.entries(NUTRITION_DATABASE).map(([key, data]) => ({
    id: key,
    name: data.name,
    aliases: data.aliases,
    defaultUnit: data.defaultUnit,
    nutritionPer100g: {
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat,
      fiber: data.fiber,
    },
  }));

  return {
    success: true,
    data: {
      ingredients,
      supportedUnits: Object.keys(UNIT_TO_GRAMS),
    },
  };
});
