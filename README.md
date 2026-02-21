# Recipe App CLI

A command-line interface for managing recipes, built with TypeScript, Supabase, and Commander.js.

## Features

- **Full CRUD operations** for recipes
- **Interactive CLI** with inquirer prompts
- **Search functionality** across recipes and ingredients
- **Batch operations** (import/export)
- **Image upload** support with Supabase Storage
- **Type-safe** with TypeScript and Zod validation

## Architecture

This is a **monorepo** project using `pnpm` workspaces:

```
recipe-app/
├── cli/                 # Command-line interface
├── services/
│   ├── recipe/          # Recipe CRUD service
│   ├── image/           # Image upload service
│   └── search/          # Search service
└── shared/
    └── types/           # Shared TypeScript types
```

## Prerequisites

- **Node.js** 18+
- **pnpm** package manager
- **Supabase** account (free tier works)

## Setup

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Create a new project named `recipe-db`
3. Select region: **Southeast Asia (Singapore)** (or closest to you)
4. Wait for project to be provisioned (~2 minutes)

### 2. Run Database Migration

1. In Supabase Dashboard, go to **SQL Editor**
2. Copy the contents of `schema.sql`
3. Paste into SQL Editor and run
4. Verify tables created: should see 7 tables

### 3. Get Supabase Credentials

1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (SUPABASE_URL)
   - **anon/public key** (SUPABASE_ANON_KEY)
   - **service_role key** (SUPABASE_SERVICE_KEY)

### 4. Configure Credentials

Create `.credentials/recipe-app-supabase.txt`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
```

Or copy from template:

```bash
cp .credentials/recipe-app-supabase.txt.template .credentials/recipe-app-supabase.txt
# Edit the file with your actual credentials
```

### 5. Install Dependencies

```bash
cd /root/.openclaw/workspace/recipe-app
pnpm install
```

### 6. Build the Project

```bash
pnpm build
```

### 7. Link the CLI

```bash
cd cli
pnpm link --global
```

Or run directly:

```bash
pnpm cli
```

## Usage

### Basic Commands

```bash
# Create a recipe interactively
recipe add

# List all recipes
recipe list

# List with filters
recipe list --category Dinner --difficulty easy

# Get recipe details
recipe get <recipe-id>

# Update a recipe
recipe update <recipe-id>

# Delete a recipe
recipe delete <recipe-id>

# Search recipes
recipe search "chicken"

# Search with options
recipe search "tomato" --scope recipes --limit 10
```

### Batch Operations

```bash
# Import recipes from JSON
recipe import recipes.json

# Export all recipes
recipe export

# Export to specific file
recipe export --output my-recipes.json

# Delete multiple recipes by pattern
recipe delete-many "chicken"
```

### Image Operations

```bash
# Upload image
recipe image upload photo.jpg

# Upload with resize options
recipe image upload photo.jpg --width 800 --height 600 --quality 85
```

## Sample Recipes

The schema includes two sample recipes:
- **Tomato and Egg Stir-fry** (番茄炒蛋)
- **Fish-Flavored Shredded Pork** (鱼香肉丝)

## Database Schema

### Tables

1. **recipes** - Main recipe data
2. **recipe_ingredients** - Ingredients for each recipe
3. **recipe_steps** - Cooking steps
4. **recipe_tags** - Recipe tags
5. **categories** - Predefined categories
6. **cuisines** - Predefined cuisines
7. **storage** - Recipe images bucket

### Key Features

- **Full-text search** with trigram indexes
- **Row Level Security (RLS)** enabled
- **Auto-updating timestamps**
- **JSONB** for nutrition info
- **Foreign key** constraints with CASCADE delete

## Development

### Project Structure

```
cli/
├── src/
│   ├── commands/      # CLI command implementations
│   ├── config.ts      # Configuration loader
│   └── index.ts       # Main entry point

services/
├── recipe/
│   └── src/
│       └── service.ts # Recipe CRUD operations
├── image/
│   └── src/
│       └── service.ts # Image upload/management
└── search/
    └── src/
        └── service.ts # Search functionality

shared/
└── types/
    └── src/
        └── index.ts   # Shared TypeScript types
```

### Adding New Commands

1. Create file in `cli/src/commands/`
2. Export a Command function
3. Register in `cli/src/index.ts`

Example:

```typescript
// cli/src/commands/mycommand.ts
import { Command } from 'commander';
import { Config } from '../config';

export function myCommand(config: Config): Command {
  return new Command('mycommand')
    .description('My custom command')
    .action(async () => {
      // Your logic here
    });
}
```

### Service Layer

All services follow this pattern:

```typescript
class MyService {
  constructor(supabaseUrl: string, supabaseKey: string) {
    // Initialize Supabase client
  }

  async myMethod(): Promise<ServiceResponse<ResultType>> {
    try {
      // Business logic
      return successResponse(data);
    } catch (error) {
      return errorResponse('ERROR_CODE', 'Message', error);
    }
  }
}
```

## Testing

### Manual Testing

```bash
# Add a test recipe
recipe add

# List recipes
recipe list

# Get the recipe (copy ID from list)
recipe get <id>

# Search for it
recipe search "test"

# Update it
recipe update <id>

# Delete it
recipe delete <id>
```

### Test Sample Data

The schema includes sample recipes for testing:

```bash
# List all recipes (should include 2 samples)
recipe list

# Search for Chinese cuisine
recipe search "chinese"

# Get a recipe by ID
recipe get <id-from-list>
```

## Troubleshooting

### Config file not found

Error: `Config file not found`

Solution: Create `.credentials/recipe-app-supabase.txt` with your credentials.

### Supabase connection error

Error: `Failed to fetch recipes`

Check:
1. SUPABASE_URL is correct
2. Supabase project is active (not paused)
3. Tables created (check SQL Editor)

### Schema not found

Error: `relation "recipes" does not exist`

Solution: Run `schema.sql` in Supabase SQL Editor.

### Permission denied

Error: `permission denied for table recipes`

Check:
1. Using correct key (anon for read, service for write)
2. RLS policies are set up

## Next Steps

### Potential Enhancements

1. **User Authentication** - Add user accounts and ownership
2. **Recipe Ratings** - Star ratings and reviews
3. **Advanced Search** - Filter by nutrition, time, etc.
4. **Recipe Collections** - Group recipes into collections
5. **Import from URLs** - Scrape recipes from websites
6. **Export to PDF** - Generate recipe cards
7. **Shopping List** - Generate shopping lists from recipes
8. **Nutrition Calculator** - Calculate total nutrition per recipe

## License

MIT

## Support

For issues or questions, check:
- Supabase docs: https://supabase.com/docs
- Commander.js docs: https://github.com/tj/commander.js
- Zod docs: https://zod.dev
