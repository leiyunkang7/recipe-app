const fs = require("fs");
const content = fs.readFileSync("/home/k/code/recipe-app/services/recipe/src/service.ts", "utf8");
const methodStart = content.indexOf("  /**\n   * Find all recipes with filters and pagination");
const updateMethod = content.indexOf("  /**\n   * Update a recipe", methodStart);
if (methodStart === -1 || updateMethod === -1) { process.exit(1); }
