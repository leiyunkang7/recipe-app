# GA4 Funnel Analysis Setup Guide

This document describes the GA4 funnel tracking implementation for the Recipe App.

## Overview

The Recipe App tracks user journeys through the following primary funnel:

```
Homepage/Listing → Recipe Detail → Cooking Mode → Step Complete → Finish Cooking
```

## Tracked Events

### Conversion Events

| Event Name | Trigger | GA4 Conversion Setting |
|------------|---------|----------------------|
| `view_recipe` | User views recipe detail page | Mark as conversion |
| `start_cooking` | User enters cooking mode | Mark as conversion |
| `finish_cooking` | User completes all cooking steps | Mark as conversion |
| `add_favorite` | User adds recipe to favorites | Mark as conversion |
| `search_query` | User performs a search | Mark as conversion |
| `user_signup` | User completes registration | Mark as conversion |
| `user_login` | User logs in | Mark as conversion |

### Funnel Events

| Event Name | Trigger | Parameters |
|------------|---------|------------|
| `page_view` | Any page view | `funnel_step`, `page_name`, `page_title` |
| `view_recipe` | Recipe detail view | `recipe_id`, `recipe_name`, `recipe_category`, `funnel_step` |
| `start_cooking` | Enter cooking mode | `recipe_id`, `recipe_name`, `total_steps`, `funnel_step` |
| `step_complete` | Complete a cooking step | `recipe_id`, `step_number`, `total_steps`, `time_on_step` |
| `finish_cooking` | Complete all steps | `recipe_id`, `recipe_name`, `total_time_spent` |
| `add_favorite` | Add to favorites | `recipe_id`, `recipe_name`, `recipe_category` |
| `remove_favorite` | Remove from favorites | `recipe_id`, `recipe_name`, `recipe_category` |
| `search_query` | Perform search | `search_query`, `results_count`, `funnel_step` |
| `filter_apply` | Apply filter | `filter_type`, `filter_value`, `results_count` |
| `share_recipe` | Share recipe | `recipe_id`, `recipe_name` |
| `timer_start` | Start step timer | `recipe_id`, `step_number` |
| `user_signup` | User registration | `signup_method` |
| `user_login` | User login | `login_method` |

## GA4 Dashboard Setup

### 1. Mark Events as Conversions

1. Go to **Admin** > **Events**
2. Find the event name (e.g., `view_recipe`, `start_cooking`)
3. Toggle **Mark as conversion** to ON

Events to mark:
- `view_recipe`
- `start_cooking`
- `finish_cooking`
- `add_favorite`
- `search_query`
- `user_signup`
- `user_login`

### 2. Create Custom Dimensions

1. Go to **Admin** > **Custom definitions** > **Custom dimensions**
2. Create the following dimensions:

| Dimension Name | Scope | Parameter Name |
|----------------|-------|---------------|
| Funnel Step | Event | `funnel_step` |
| Recipe ID | Event | `recipe_id` |
| Recipe Name | Event | `recipe_name` |
| Recipe Category | Event | `recipe_category` |
| Step Number | Event | `step_number` |
| Total Steps | Event | `total_steps` |
| Search Query | Event | `search_query` |
| Results Count | Event | `results_count` |
| Filter Type | Event | `filter_type` |
| Filter Value | Event | `filter_value` |

### 3. Create Funnel in Explorations

1. Go to **Explorations** > **Template Gallery**
2. Select **Funnels** template
3. Define funnel steps:

```
Step 1: page_view (where funnel_step = homepage)
Step 2: view_recipe
Step 3: start_cooking
Step 4: step_complete
Step 5: finish_cooking
```

Or build a path analysis:
1. Go to **Explorations** > **Path exploration**
2. Define starting point: `page_view` with `funnel_step = homepage`
3. Set end point: `finish_cooking`

### 4. Secondary Funnels

**Search/Discovery Funnel:**
```
page_view (funnel_step = homepage)
  → search_query
  → filter_apply
  → view_recipe
```

**Favorite Funnel:**
```
page_view
  → view_recipe
  → add_favorite
  → page_view (funnel_step = favorites)
```

**Auth Funnel:**
```
page_view
  → page_view (funnel_step = auth)
  → user_signup
  → page_view (funnel_step = homepage)
```

## Funnel Step Values

| Step Value | Description |
|------------|-------------|
| `homepage` | Homepage, root path |
| `recipe_listing` | Recipe listing page |
| `recipe_detail` | Individual recipe page |
| `cooking_mode` | Active cooking mode |
| `cooking_complete` | Finished cooking |
| `favorites` | Favorites page |
| `search` | Search results |
| `profile` | User profile pages |
| `auth` | Login/register pages |
| `other` | Unclassified pages |

## Cookie & Consent Settings

The plugin sets:
- `cookie_flags: SameSite=None;Secure` - Required for cross-origin tracking
- `cookie_expires: 63072000` - 2 years cookie expiration
- `cookie_domain: auto` - Automatic domain detection

If using cookie consent (GDPR, CCPA):
1. Delay gtag config until consent is granted, OR
2. Use `gtag('consent', 'default', {...})` to set default consent mode

## Enhanced Measurement

Enhanced measurement is enabled for:
- Scroll tracking
- Outbound link clicks
- Site search
- Video engagement
- File downloads

## Debug & Testing

### GA4 DebugView
1. Install **GA DebugView** Chrome extension
2. Enable debug mode: `&gtm_debug=1` query parameter
3. Trigger events and verify in DebugView

### Event Parameters
Verify all parameters are correctly sent:
- `funnel_step` should match the current page type
- `recipe_id` should be a valid UUID
- `step_number` should be 1-indexed

## Retention Settings

GA4 default retention is 2 months. For funnel analysis:
1. Go to **Admin** > **Data settings** > **Retention**
2. Set to maximum (14 months) for better funnel analysis

## Related Files

- `web/app/plugins/vue-gtag.client.ts` - GA4 plugin with funnel config
- `web/app/composables/useAnalytics.ts` - Analytics composable with tracking functions
- `web/nuxt.config.ts` - GA_ID configuration
- `.env.example` - Environment variable template
