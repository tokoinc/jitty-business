// 予算の無駄遣いにつながるシェル操作を止める（AGENTS.md「予算の無駄遣いをしない」）。
// 空コミットは拒否し、PR の作成と CI の再実行・手動実行は毎回確認を求める。
import { readFileSync } from 'node:fs'

const input = JSON.parse(readFileSync(0, 'utf8'))
const command = String(input.tool_input?.command ?? '')

const rules = [
  ['deny', /\bgit\b[^;&|]*\bcommit\b[^;&|]*--allow-empty(?![-\w])/, '空コミットは禁止'],
  ['ask', /\bgh\s+pr\s+create\b/, 'PR は原則作らない。必要な理由を示して確認を取る'],
  ['ask', /\bgh\s+run\s+rerun\b/, 'CI の再実行は利用枠を使う。理由と回数を示して確認を取る'],
  ['ask', /\bgh\s+workflow\s+run\b/, 'ワークフローの手動実行は利用枠を使う。理由と回数を示して確認を取る'],
]

for (const [decision, pattern, reason] of rules) {
  if (pattern.test(command)) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: decision,
          permissionDecisionReason: '[budget-guard] ' + reason,
        },
      }) + '\n',
    )
    break
  }
}
