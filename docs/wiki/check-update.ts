#!/usr/bin/env bun
import { $ } from "bun";

const WIKI_DIR = import.meta.dir;
const VERSION_FILE = `${WIKI_DIR}/.version`;
const PROJECT_ROOT = `${WIKI_DIR}/../..`;

const colors = {
  red: "\x1b[0;31m",
  green: "\x1b[0;32m",
  yellow: "\x1b[1;33m",
  blue: "\x1b[0;34m",
  reset: "\x1b[0m",
};

function printInfo(msg: string) {
  console.log(`${colors.blue}ℹ ${msg}${colors.reset}`);
}

function printSuccess(msg: string) {
  console.log(`${colors.green}✓ ${msg}${colors.reset}`);
}

function printWarning(msg: string) {
  console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`);
}

function printError(msg: string) {
  console.log(`${colors.red}✗ ${msg}${colors.reset}`);
}

async function getCurrentHash(): Promise<string> {
  const result = await $`git -C ${PROJECT_ROOT} rev-parse HEAD`.quiet();
  return result.text().trim();
}

async function getShortHash(): Promise<string> {
  const result = await $`git -C ${PROJECT_ROOT} rev-parse --short HEAD`.quiet();
  return result.text().trim();
}

async function getCommitInfo(): Promise<string> {
  const result = await $`git -C ${PROJECT_ROOT} log -1 --format=%s`.quiet();
  return result.text().trim();
}

async function getLastHash(): Promise<string> {
  try {
    const file = Bun.file(VERSION_FILE);
    if (await file.exists()) {
      return (await file.text()).trim();
    }
    return "";
  } catch {
    return "";
  }
}

function analyzeUpdates(changes: string): string[] {
  const updates: Set<string> = new Set();

  if (/services\//.test(changes)) {
    updates.add("ARCHITECTURE.md - 架构设计文档");
    updates.add("API.md - API 接口文档");
  }

  if (/database\/|schema\.sql/.test(changes)) {
    updates.add("DATABASE.md - 数据库设计文档");
    updates.add("API.md - API 接口文档");
  }

  if (/cli\//.test(changes)) {
    updates.add("CLI.md - CLI 使用指南");
  }

  if (/web\/app|web\/server|web\/components/.test(changes)) {
    updates.add("WEB.md - Web 应用文档");
  }

  if (/shared\/types\//.test(changes)) {
    updates.add("ARCHITECTURE.md - 架构设计文档");
    updates.add("API.md - API 接口文档");
  }

  if (/package\.json|tsconfig|bun\.lockb/.test(changes)) {
    updates.add("DEVELOPMENT.md - 开发指南");
    updates.add("DEEPWIKI.md - 文档索引");
  }

  if (/README\.md|AGENTS\.md/.test(changes)) {
    updates.add("DEEPWIKI.md - 文档索引");
  }

  return Array.from(updates).sort();
}

async function main() {
  console.log("");
  console.log("========================================");
  console.log("  DeepWiki 增量更新检测");
  console.log("========================================");
  console.log("");

  const currentHash = await getCurrentHash();
  const shortHash = await getShortHash();
  const commitInfo = await getCommitInfo();
  let lastHash = await getLastHash();

  printInfo(`当前 Commit: ${shortHash}`);
  printInfo(`Commit 信息: ${commitInfo}`);

  if (!lastHash) {
    printWarning("未找到上次版本记录，将进行完整检测");
    try {
      const result = await $`git -C ${PROJECT_ROOT} rev-parse HEAD~1`.quiet();
      lastHash = result.text().trim();
    } catch {
      lastHash = "";
    }
  } else {
    try {
      const result = await $`git -C ${PROJECT_ROOT} rev-parse --short ${lastHash}`.quiet();
      printInfo(`上次版本: ${result.text().trim()}`);
    } catch {
      printInfo("上次版本: unknown");
    }
  }

  console.log("");

  if (lastHash === currentHash) {
    printSuccess("文档已是最新版本");
    process.exit(0);
  }

  printInfo("检测文件变更...");

  let changes: string;
  try {
    const result = await $`git -C ${PROJECT_ROOT} diff --name-only ${lastHash} ${currentHash}`.quiet();
    changes = result.text().trim();
  } catch {
    changes = "";
  }

  if (!changes) {
    printWarning("未检测到文件变更");
    process.exit(0);
  }

  console.log("");
  console.log("变更的文件:");
  for (const file of changes.split("\n")) {
    if (file) {
      console.log(`  - ${file}`);
    }
  }

  console.log("");
  printInfo("分析需要更新的文档...");
  const updates = analyzeUpdates(changes);

  if (updates.length === 0) {
    printSuccess("无需更新文档");
  } else {
    console.log("");
    console.log("需要更新的文档:");
    for (const doc of updates) {
      console.log(`  📄 ${doc}`);
    }

    console.log("");
    console.log("========================================");
    console.log("  更新建议");
    console.log("========================================");
    console.log("");
    console.log("1. 更新相关文档内容");
    console.log(`2. 更新文档底部的 Commit hash 为: ${shortHash}`);
    console.log("3. 更新版本文件:");
    console.log(`   echo '${currentHash}' > docs/wiki/.version`);
    console.log("4. 更新 docs/wiki/.version.md 中的版本信息");
    console.log("5. 提交更新:");
    console.log("   git add docs/wiki/");
    console.log(`   git commit -m 'docs: 更新 DeepWiki 至 ${shortHash}'`);
  }
}

main().catch((err) => {
  printError(err.message);
  process.exit(1);
});
