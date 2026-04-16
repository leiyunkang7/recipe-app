#!/usr/bin/env bun
/**
 * recipe-app Flywheel Diagnostics
 *
 * Scans the task pool (.recipe-task-pool.md) and iterator state,
 * identifies failures, and generates a diagnostic report.
 *
 * Usage:
 *   bun scripts/flywheel-diagnostics.ts
 *   bun scripts/flywheel-diagnostics.ts --fix
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const APP_DIR = "/root/code/recipe-app";
const TASK_POOL = resolve(APP_DIR, ".recipe-task-pool.md");
const ITERATOR_STATE = resolve(APP_DIR, ".recipe-iterator-state.json");
const REPORT_FILE = resolve(APP_DIR, ".flywheel-diagnostics-report.json");

interface TaskEntry {
  id: string;
  task: string;
  status: "pending" | "done" | "failed";
  error?: string;
  source?: string;
  addedAt?: string;
}

interface DiagnosticsReport {
  generatedAt: string;
  totalTasks: number;
  pending: number;
  done: number;
  failed: number;
  failedTasks: TaskEntry[];
  recommendations: string[];
  iteratorState: Record<string, unknown>;
}

function parseTaskPool(path: string): TaskEntry[] {
  const tasks: TaskEntry[] = [];
  const content = readFileSync(path, "utf-8");

  // Parse failed tasks with error tags: ! [timestamp] (失败: verify_failed) ...
  const failedRegex =
    /! \[([^\]]+)\]\s+\([^)]+\)\s+.*?\*\*([^*]+)\*\*[\s\S]*?描述:\s*([^\n]+)/g;
  let m: RegExpExecArray | null;
  while ((m = failedRegex.exec(content)) !== null) {
    const errorLine = content.slice(m.index, m.index + 200);
    const errorMatch = errorLine.match(/\(失败:\s*([^)]+)\)/);
    tasks.push({
      id: m[1].trim(),
      task: m[2].trim(),
      status: "failed",
      error: errorMatch ? errorMatch[1].trim() : "unknown",
      addedAt: m[1].trim(),
    });
  }

  // Parse completed tasks: - [x] ...
  const doneRegex = /- \[x\]\s+.*?\*\*([^*]+)\*\*[\s\S]*?描述:\s*([^\n]+)/g;
  while ((m = doneRegex.exec(content)) !== null) {
    tasks.push({
      id: "",
      task: m[1].trim(),
      status: "done",
    });
  }

  // Parse pending tasks: - [ ] ...
  const pendingRegex = /- \[\s?\]\s+.*?\*\*([^*]+)\*\*[\s\S]*?描述:\s*([^\n]+)/g;
  while ((m = pendingRegex.exec(content)) !== null) {
    tasks.push({
      id: "",
      task: m[1].trim(),
      status: "pending",
    });
  }

  return tasks;
}

function parseIteratorState(path: string): Record<string, unknown> {
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return {};
  }
}

function generateRecommendations(tasks: TaskEntry[]): string[] {
  const recs: string[] = [];
  const failed = tasks.filter((t) => t.status === "failed");

  if (failed.length === 0) {
    recs.push("✅ 没有失败任务，飞轮运行正常");
    return recs;
  }

  const verifyFailed = failed.filter(
    (t) => t.error === "verify_failed" || t.error === "verify_fail"
  );
  const buildFailed = failed.filter(
    (t) =>
      t.error === "build_failed" ||
      t.task.toLowerCase().includes("build")
  );

  if (verifyFailed.length > 0) {
    recs.push(
      `⚠️  ${verifyFailed.length} 个任务 verify_failed：建议检查 API 端点和 UI 组件是否完整实现`
    );
  }

  if (buildFailed.length > 0) {
    recs.push(
      `⚠️  ${buildFailed.length} 个任务 build_failed：建议运行 npm run build 检查编译错误`
    );
  }

  const bigComponent = failed.filter(
    (t) => t.task.includes("拆分") && t.task.includes("行")
  );
  if (bigComponent.length > 0) {
    recs.push(
      `🔧 ${bigComponent.length} 个大组件拆分任务失败：建议手动拆分后重新提交`
    );
  }

  return recs;
}

function run() {
  console.log("🔍 recipe-app 飞轮诊断开始...\n");

  if (!existsSync(TASK_POOL)) {
    console.error(`❌ 任务池文件不存在: ${TASK_POOL}`);
    process.exit(1);
  }

  const tasks = parseTaskPool(TASK_POOL);
  const iteratorState = parseIteratorState(ITERATOR_STATE);
  const recommendations = generateRecommendations(tasks);

  const report: DiagnosticsReport = {
    generatedAt: new Date().toISOString(),
    totalTasks: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    done: tasks.filter((t) => t.status === "done").length,
    failed: tasks.filter((t) => t.status === "failed").length,
    failedTasks: tasks.filter((t) => t.status === "failed"),
    recommendations,
    iteratorState,
  };

  // Console output
  console.log(`📊 任务统计`);
  console.log(`   总计: ${report.totalTasks}`);
  console.log(`   ✅ 完成: ${report.done}`);
  console.log(`   ⏳ 待处理: ${report.pending}`);
  console.log(`   ❌ 失败: ${report.failed}`);
  console.log("");

  if (report.failedTasks.length > 0) {
    console.log("❌ 失败任务详情:");
    report.failedTasks.forEach((t) => {
      console.log(`   - ${t.task} [${t.error || "unknown"}]`);
    });
    console.log("");
  }

  console.log("💡 建议:");
  recommendations.forEach((r) => console.log(`   ${r}`));
  console.log("");

  // Write JSON report
  writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(`📄 报告已保存: ${REPORT_FILE}`);
}

run();
