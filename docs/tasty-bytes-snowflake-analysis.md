# Tasty-Bytes Snowflake Analysis

P3 | 2026-04-07

## Overview
Tasty-Bytes is Snowflake sample dataset for restaurant chain analytics using Star Schema.

## Core Architecture
Fact Tables: SALE_FACTS, RECIPE_NUTRITION_FACTS
Dim Tables: MENU_DIM, CUSTOMER_DIM, STORE_DIM, DATE_DIM

## Recipe App Mapping
| Tasty-Bytes | Recipe App |
| Menu Items | Recipes |
| Ingredients | Ingredients |
| Orders | User Cookings |

## Key Metrics
- Recipe Engagement Rate = Favorites / Views
- Cooking Completion Rate = Completions / Starts
- Ingredient Affinity = Co-occurrence frequency

## Implementation Phases
1. Data Collection (P2)
2. Data Warehouse (P2)
3. Analytics Application (P1)

Completed: 2026-04-07