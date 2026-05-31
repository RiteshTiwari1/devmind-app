/**
 * DevMind GitAgent Runner — Proper SkillFlow Implementation
 *
 * Implements the same executeFlow() pattern as GitAgent's voice/server.ts:
 * - Loads pr-truth-engine.yaml workflow
 * - Runs each step as a separate query() call
 * - Each step reads its own SKILL.md via the read tool
 * - runningContext passes accumulated results forward
 * - submit_truth_analysis tool on generate-truth-report step → structured JSON
 *
 * Steps handled by Python backend (skipped here):
 *   step 8: post-github-comment → Python posts via github_client.py
 *   step 9: update-developer-memory → Python rebuilds MEMORY.md from JSON
 */

import { query, tool } from "@open-gitagent/gitagent";
import { readFile } from "fs/promises";
import { join } from "path";
import yaml from "js-yaml";

interface PRInput {
  repo: string;
  pr_number: number;
  pr_author: string;
  pr_title: string;
  pr_body: string;
  diff: string;
  issue_content: string;
  developer_memory: string;
  agent_dir: string;
}

interface WorkflowStep {
  skill: string;
  prompt: string;
}

interface Workflow {
  name: string;
  steps: WorkflowStep[];
}

async function main() {
  const input: PRInput = JSON.parse(process.argv[2]);
  let capturedResult: any = null;

  // submit_truth_analysis — only added as tool on generate-truth-report step
  // Forces structured JSON output from that final analysis step
  const submitAnalysis = tool(
    "submit_truth_analysis",
    "Submit the completed PR Truth Analysis. Call this with structured findings from all previous steps.",
    {
      type: "object",
      properties: {
        truth_score: { type: "number", description: "0-100, average of requirement scores" },
        verdict: { type: "string", enum: ["APPROVED", "NEEDS_WORK", "INCOMPLETE"] },
        promise_summary: { type: "string" },
        claim_summary: { type: "string" },
        reality_summary: { type: "string" },
        requirements: {
          type: "array",
          items: {
            type: "object",
            properties: {
              req: { type: "string" },
              status: { type: "string", enum: ["FULLY_MET", "PARTIALLY_MET", "NOT_MET"] },
              evidence: { type: "string" },
              score: { type: "number" }
            },
            required: ["req", "status", "evidence", "score"]
          }
        },
        security_findings: { type: "string" },
        quality_findings: { type: "string" },
        what_is_missing: { type: "array", items: { type: "string" } },
        developer_note: { type: "string" }
      },
      required: ["truth_score", "verdict", "requirements", "security_findings", "what_is_missing"]
    },
    async (args) => {
      capturedResult = args;
      return { text: "Analysis captured. Python backend will post the comment." };
    }
  );

  // Load the workflow YAML directly
  const flowPath = join(input.agent_dir, "workflows", "pr-truth-engine.yaml");
  const raw = await readFile(flowPath, "utf-8");
  const flow = yaml.load(raw) as Workflow;
  const steps = flow.steps;

  // Initial runningContext — pre-fetched by Python so skills 1-2 don't need GitHub API
  let runningContext = `## Pre-fetched PR Data (no GitHub API calls needed)

Repo: ${input.repo}
PR #${input.pr_number}: ${input.pr_title}
Author: ${input.pr_author}

### PR Description (CLAIM)
${input.pr_body || "No description provided."}

### GitHub Issue (PROMISE)
${input.issue_content || "No linked issue found. Review code quality only."}

### Code Diff (REALITY)
${input.diff}

### Developer Memory for ${input.pr_author}
${input.developer_memory || "First review for this developer."}`;

  process.stderr.write(`\nRunning workflow: ${flow.name} (${steps.length} steps)\n`);

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepNum = i + 1;
    const isGenerateReport = step.skill === "generate-truth-report";
    const isPostComment = step.skill === "post-github-comment";
    const isUpdateMemory = step.skill === "update-developer-memory";

    // Python handles posting and memory — skip these steps
    if (isPostComment || isUpdateMemory) {
      process.stderr.write(`Step ${stepNum}/${steps.length}: ${step.skill} — skipped (Python handles)\n`);
      continue;
    }

    process.stderr.write(`Step ${stepNum}/${steps.length}: ${step.skill}...\n`);

    // Replace workflow template variables
    const stepPrompt = step.prompt
      .replace(/\{PR_NUMBER\}/g, String(input.pr_number))
      .replace(/\{REPO\}/g, input.repo)
      .replace(/\{PR_AUTHOR\}/g, input.pr_author);

    // Build prompt — exactly like GitAgent's executeFlow() in voice/server.ts
    const prompt = `Use the skill "${step.skill}".
First read the skill file: skills/${step.skill}/SKILL.md
Then follow its instructions for this task:

${stepPrompt}

## Context from Previous Steps
${runningContext}`;

    // Only provide submit_truth_analysis on the generate-truth-report step
    const tools = isGenerateReport ? [submitAnalysis] : [];

    let stepOutput = "";

    try {
      for await (const msg of query({
        prompt,
        dir: input.agent_dir,
        model: "openai:gpt-4o",
        tools,
        constraints: { temperature: 0.1, maxTokens: 4096 },
        hooks: {
          preToolUse: async (ctx) => {
            // Block GitHub API curl calls — data is already in context
            if (ctx.toolName === "cli") {
              const cmd = (ctx.args?.command || "") as string;
              if (cmd.includes("github.com") || (cmd.includes("curl") && cmd.includes("api"))) {
                return { action: "block", reason: "GitHub data already in context — no API call needed" };
              }
            }
            return { action: "allow" };
          },
          onError: async (ctx) => {
            process.stderr.write(`  Error in step ${stepNum}: ${ctx.error}\n`);
          }
        }
      })) {
        if (msg.type === "tool_use") {
          process.stderr.write(`  → ${msg.toolName}\n`);
        }
        if (msg.type === "assistant" && msg.content) {
          stepOutput += msg.content;
        }
      }
    } catch (err: any) {
      process.stderr.write(`Step ${stepNum} failed: ${err.message}\n`);
    }

    // Accumulate — same as executeFlow() in GitAgent source
    runningContext += `\n\n[Step ${stepNum} - ${step.skill}]:\n${stepOutput}`;
    process.stderr.write(`Step ${stepNum} done\n`);
  }

  if (!capturedResult) {
    process.stderr.write("generate-truth-report did not call submit_truth_analysis\n");
    process.exit(1);
  }

  process.stdout.write(JSON.stringify(capturedResult));
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
