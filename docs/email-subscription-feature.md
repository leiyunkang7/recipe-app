# Email Subscription Feature

This feature allows users to subscribe to email notifications for new recipes published in specific categories or by specific authors.

## Features

1. **Category Subscriptions** - Users can subscribe to receive notifications when new recipes are published in specific categories (e.g., breakfast, dinner, dessert)
2. **Author Subscriptions** - Users can subscribe to receive notifications when specific authors publish new recipes
3. **Email Notifications** - Automated email notifications sent via Supabase Edge Functions
4. **Subscription Management** - Users can manage their subscriptions (subscribe/unsubscribe)

## API Endpoints

### Category Subscriptions

- `POST /api/subscriptions/categories` - Subscribe to a category
- `GET /api/subscriptions/categories` - List user's category subscriptions
- `DELETE /api/subscriptions/categories/[category]` - Unsubscribe from a category

### Author Subscriptions

- `POST /api/subscriptions/authors` - Subscribe to an author
- `GET /api/subscriptions/authors` - List user's author subscriptions
- `DELETE /api/subscriptions/authors/[authorName]` - Unsubscribe from an author

## Database Schema

The feature adds two new tables:

1. `category_subscriptions` - Tracks user subscriptions to categories
2. `author_subscriptions` - Tracks user subscriptions to authors

## Supabase Edge Functions

Two Edge Functions handle email notifications:

1. `send-category-notification` - Sends notifications to category subscribers
2. `send-author-notification` - Sends notifications to author subscribers

## Email Service

The email service has been enhanced with:

- `sendNewRecipeEmail` - Sends new recipe notification emails
- Custom email templates for new recipe announcements

## Setup

1. Deploy the database migration (`009_add_subscription_tables.sql`)
2. Deploy the Supabase Edge Functions (`supabase/functions/`)
3. Configure environment variables for email service
4. Set up database triggers to call the Edge Functions

## Testing

To test the feature:

1. Subscribe to a category or author
2. Publish a new recipe in that category/by that author
3. Check that notifications are created and emails are sent