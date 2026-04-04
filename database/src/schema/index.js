"use strict";
/**
 * Database Schema - Unified Exports
 *
 * All table definitions, relations, and types for the recipe-app database.
 * This is the single source of truth consumed by drizzle-orm queries.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.favoritesRelations = exports.recipeRatings = exports.favoriteFolders = exports.favorites = exports.cuisines = exports.categories = exports.cuisinesRelations = exports.categoriesRelations = exports.cuisineTranslationsRelations = exports.categoryTranslationsRelations = exports.stepTranslationsRelations = exports.ingredientTranslationsRelations = exports.recipeTranslationsRelations = exports.cuisineTranslations = exports.categoryTranslations = exports.stepTranslations = exports.ingredientTranslations = exports.recipeTranslations = exports.recipeTagsRelations = exports.recipeStepsRelations = exports.recipeIngredientsRelations = exports.recipesRelations = exports.recipeTags = exports.recipeSteps = exports.recipeIngredients = exports.recipes = void 0;
// Core recipe tables
var recipes_1 = require("./recipes");
Object.defineProperty(exports, "recipes", { enumerable: true, get: function () { return recipes_1.recipes; } });
Object.defineProperty(exports, "recipeIngredients", { enumerable: true, get: function () { return recipes_1.recipeIngredients; } });
Object.defineProperty(exports, "recipeSteps", { enumerable: true, get: function () { return recipes_1.recipeSteps; } });
Object.defineProperty(exports, "recipeTags", { enumerable: true, get: function () { return recipes_1.recipeTags; } });
Object.defineProperty(exports, "recipesRelations", { enumerable: true, get: function () { return recipes_1.recipesRelations; } });
Object.defineProperty(exports, "recipeIngredientsRelations", { enumerable: true, get: function () { return recipes_1.recipeIngredientsRelations; } });
Object.defineProperty(exports, "recipeStepsRelations", { enumerable: true, get: function () { return recipes_1.recipeStepsRelations; } });
Object.defineProperty(exports, "recipeTagsRelations", { enumerable: true, get: function () { return recipes_1.recipeTagsRelations; } });
// i18n translation tables (also includes relations for taxonomy tables)
var i18n_1 = require("./i18n");
Object.defineProperty(exports, "recipeTranslations", { enumerable: true, get: function () { return i18n_1.recipeTranslations; } });
Object.defineProperty(exports, "ingredientTranslations", { enumerable: true, get: function () { return i18n_1.ingredientTranslations; } });
Object.defineProperty(exports, "stepTranslations", { enumerable: true, get: function () { return i18n_1.stepTranslations; } });
Object.defineProperty(exports, "categoryTranslations", { enumerable: true, get: function () { return i18n_1.categoryTranslations; } });
Object.defineProperty(exports, "cuisineTranslations", { enumerable: true, get: function () { return i18n_1.cuisineTranslations; } });
Object.defineProperty(exports, "recipeTranslationsRelations", { enumerable: true, get: function () { return i18n_1.recipeTranslationsRelations; } });
Object.defineProperty(exports, "ingredientTranslationsRelations", { enumerable: true, get: function () { return i18n_1.ingredientTranslationsRelations; } });
Object.defineProperty(exports, "stepTranslationsRelations", { enumerable: true, get: function () { return i18n_1.stepTranslationsRelations; } });
Object.defineProperty(exports, "categoryTranslationsRelations", { enumerable: true, get: function () { return i18n_1.categoryTranslationsRelations; } });
Object.defineProperty(exports, "cuisineTranslationsRelations", { enumerable: true, get: function () { return i18n_1.cuisineTranslationsRelations; } });
Object.defineProperty(exports, "categoriesRelations", { enumerable: true, get: function () { return i18n_1.categoriesRelations; } });
Object.defineProperty(exports, "cuisinesRelations", { enumerable: true, get: function () { return i18n_1.cuisinesRelations; } });
// Taxonomy tables
var taxonomy_1 = require("./taxonomy");
Object.defineProperty(exports, "categories", { enumerable: true, get: function () { return taxonomy_1.categories; } });
Object.defineProperty(exports, "cuisines", { enumerable: true, get: function () { return taxonomy_1.cuisines; } });
// Auth-dependent tables (preserved but disabled in API)
var favorites_1 = require("./favorites");
Object.defineProperty(exports, "favorites", { enumerable: true, get: function () { return favorites_1.favorites; } });
Object.defineProperty(exports, "favoriteFolders", { enumerable: true, get: function () { return favorites_1.favoriteFolders; } });
Object.defineProperty(exports, "recipeRatings", { enumerable: true, get: function () { return favorites_1.recipeRatings; } });
Object.defineProperty(exports, "favoritesRelations", { enumerable: true, get: function () { return favorites_1.favoritesRelations; } });
