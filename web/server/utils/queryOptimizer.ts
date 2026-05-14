/**
 * Query Optimizer Utility
 *
 * Eliminates N+1 query patterns by batching database reads.
 * Instead of making N queries for N records, makes 1 query for all records.
 */

import { eq, inArray, count } from 'drizzle-orm';
import { recipeIngredients, recipeSteps, recipeTags, recipeTranslations, cookingGroupMembers, cookingChallenges, cookingChallengeParticipants, users, recipes } from '@recipe-app/database';

export interface RecipeRelatedData {
  ingredients: any[];
  steps: any[];
  tags: any[];
  translations: any[];
}

export interface GroupRelatedData {
  memberCounts: Map<string, number>;
  challengeCounts: Map<string, number>;
}

export interface ChallengeRelatedData {
  participantCounts: Map<string, number>;
}

export interface ParticipantUserData {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface MemberUserData {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
}

/**
 * Batch fetch all recipe-related data for multiple recipes at once.
 * Eliminates 4N queries -> 4 queries total.
 */
export async function batchFetchRecipeRelatedData(
  db: any,
  recipeIds: string[],
  locale?: string
): Promise<Map<string, RecipeRelatedData>> {
  const result = new Map<string, RecipeRelatedData>();

  if (recipeIds.length === 0) {
    return result;
  }

  // Batch fetch ingredients for all recipes
  const allIngredients = await db
    .select()
    .from(recipeIngredients)
    .where(inArray(recipeIngredients.recipeId, recipeIds));

  // Batch fetch steps for all recipes
  const allSteps = await db
    .select()
    .from(recipeSteps)
    .where(inArray(recipeSteps.recipeId, recipeIds));

  // Batch fetch tags for all recipes
  const allTags = await db
    .select()
    .from(recipeTags)
    .where(inArray(recipeTags.recipeId, recipeIds));

  // Batch fetch translations if locale specified
  let allTranslations: any[] = [];
  if (locale) {
    allTranslations = await db
      .select()
      .from(recipeTranslations)
      .where(inArray(recipeTranslations.recipeId, recipeIds));
  }

  // Group data by recipe ID
  const ingredientsByRecipe = new Map<string, any[]>();
  const stepsByRecipe = new Map<string, any[]>();
  const tagsByRecipe = new Map<string, any[]>();
  const translationsByRecipe = new Map<string, any[]>();

  for (const ing of allIngredients) {
    if (!ingredientsByRecipe.has(ing.recipeId)) {
      ingredientsByRecipe.set(ing.recipeId, []);
    }
    ingredientsByRecipe.get(ing.recipeId)!.push(ing);
  }

  for (const step of allSteps) {
    if (!stepsByRecipe.has(step.recipeId)) {
      stepsByRecipe.set(step.recipeId, []);
    }
    stepsByRecipe.get(step.recipeId)!.push(step);
  }

  for (const tag of allTags) {
    if (!tagsByRecipe.has(tag.recipeId)) {
      tagsByRecipe.set(tag.recipeId, []);
    }
    tagsByRecipe.get(tag.recipeId)!.push(tag);
  }

  for (const trans of allTranslations) {
    if (!translationsByRecipe.has(trans.recipeId)) {
      translationsByRecipe.set(trans.recipeId, []);
    }
    translationsByRecipe.get(trans.recipeId)!.push(trans);
  }

  // Build result map
  for (const recipeId of recipeIds) {
    result.set(recipeId, {
      ingredients: ingredientsByRecipe.get(recipeId) || [],
      steps: stepsByRecipe.get(recipeId) || [],
      tags: tagsByRecipe.get(recipeId) || [],
      translations: translationsByRecipe.get(recipeId) || [],
    });
  }

  return result;
}

/**
 * Batch fetch member counts for multiple groups at once.
 * Eliminates 2N queries -> 2 queries total.
 */
export async function batchFetchGroupCounts(
  db: any,
  groupIds: string[]
): Promise<GroupRelatedData> {
  const memberCounts = new Map<string, number>();
  const challengeCounts = new Map<string, number>();

  if (groupIds.length === 0) {
    return { memberCounts, challengeCounts };
  }

  // Batch fetch member counts
  const memberCountResults = await db
    .select({
      groupId: cookingGroupMembers.groupId,
      count: count(),
    })
    .from(cookingGroupMembers)
    .where(inArray(cookingGroupMembers.groupId, groupIds))
    .groupBy(cookingGroupMembers.groupId);

  for (const row of memberCountResults) {
    memberCounts.set(row.groupId, Number(row.count));
  }

  // Batch fetch challenge counts
  const challengeCountResults = await db
    .select({
      groupId: cookingChallenges.groupId,
      count: count(),
    })
    .from(cookingChallenges)
    .where(inArray(cookingChallenges.groupId, groupIds))
    .groupBy(cookingChallenges.groupId);

  for (const row of challengeCountResults) {
    challengeCounts.set(row.groupId, Number(row.count));
  }

  return { memberCounts, challengeCounts };
}

/**
 * Batch fetch participant counts for multiple challenges at once.
 * Eliminates N queries -> 1 query total.
 */
export async function batchFetchChallengeParticipantCounts(
  db: any,
  challengeIds: string[]
): Promise<ChallengeRelatedData> {
  const participantCounts = new Map<string, number>();

  if (challengeIds.length === 0) {
    return { participantCounts };
  }

  const countResults = await db
    .select({
      challengeId: cookingChallengeParticipants.challengeId,
      count: count(),
    })
    .from(cookingChallengeParticipants)
    .where(inArray(cookingChallengeParticipants.challengeId, challengeIds))
    .groupBy(cookingChallengeParticipants.challengeId);

  for (const row of countResults) {
    participantCounts.set(row.challengeId, Number(row.count));
  }

  return { participantCounts };
}

/**
 * Batch fetch user and recipe info for multiple participants at once.
 * Eliminates 2N queries -> 2 queries total.
 */
export async function batchFetchParticipantUserData(
  db: any,
  userIds: string[],
  recipeIds: (string | null)[]
): Promise<{ users: Map<string, ParticipantUserData>; recipes: Map<string, { id: string; title: string; imageUrl: string | null }> }> {
  const userMap = new Map<string, ParticipantUserData>();
  const recipeMap = new Map<string, { id: string; title: string; imageUrl: string | null }>();

  if (userIds.length === 0 && recipeIds.filter(Boolean).length === 0) {
    return { users: userMap, recipes: recipeMap };
  }

  // Batch fetch user info
  const uniqueUserIds = [...new Set(userIds)];
  if (uniqueUserIds.length > 0) {
    const userResults = await db
      .select({
        id: users.id,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(inArray(users.id, uniqueUserIds));

    for (const user of userResults) {
      userMap.set(user.id, {
        userId: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      });
    }
  }

  // Batch fetch recipe info
  const uniqueRecipeIds = recipeIds.filter((id): id is string => id !== null);
  if (uniqueRecipeIds.length > 0) {
    const recipeResults = await db
      .select({
        id: recipes.id,
        title: recipes.title,
        imageUrl: recipes.imageUrl,
      })
      .from(recipes)
      .where(inArray(recipes.id, uniqueRecipeIds));

    for (const recipe of recipeResults) {
      recipeMap.set(recipe.id, {
        id: recipe.id,
        title: recipe.title,
        imageUrl: recipe.imageUrl,
      });
    }
  }

  return { users: userMap, recipes: recipeMap };
}

/**
 * Batch fetch user info for multiple group members at once.
 * Eliminates N queries -> 1 query total.
 */
export async function batchFetchMemberUserData(
  db: any,
  userIds: string[]
): Promise<Map<string, MemberUserData>> {
  const result = new Map<string, MemberUserData>();

  if (userIds.length === 0) {
    return result;
  }

  const uniqueUserIds = [...new Set(userIds)];
  const userResults = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(inArray(users.id, uniqueUserIds));

  for (const user of userResults) {
    result.set(user.id, {
      userId: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    });
  }

  return result;
}
