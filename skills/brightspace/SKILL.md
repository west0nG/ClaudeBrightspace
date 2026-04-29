---
name: brightspace
description: USC Brightspace (D2L) assistant. Use when the user asks about their USC homework, assignments, coursework, deadlines, due dates, what's due, what an assignment requires, downloading assignment files, course list, or anything involving brightspace.usc.edu / D2L. Triggers in Chinese ("有啥作业", "X作业是啥", "ddl") and English alike.
user-invocable: true
disable-model-invocation: false
---

# Brightspace skill

Conversational query layer over USC Brightspace. The user asks Claude things
like "我有啥作业 / 这周还有几个 ddl / X 作业具体要交什么 / 下载 Y 的附件",
and Claude answers by calling the local `bs` CLI (Node + Playwright +
system Chrome). Session persists across Claude Code restarts via a
storageState JSON file at `<skill>/.userdata/storageState.json`.

## Stack — what you actually call

All operations go through one bash script. **First, resolve its path** (the
skill might be installed as a plugin or as a user-level skill):

```bash
BS=$(find ~/.claude -path "*/brightspace/bs" -type f 2>/dev/null | head -1)
```

Use `$BS` in every subsequent command. Typical resolved paths:
- Plugin: `~/.claude/plugins/marketplaces/ClaudeBrightspace/skills/brightspace/bs`
- Local: `~/.claude/skills/brightspace/bs`

The script auto-installs `playwright` (npm) on first run. It launches the
**user's installed Chrome** (no chromium download) headless for queries,
headed for login. Cookies stay in `.userdata/storageState.json` for ~days.

**You never call the Playwright MCP for this skill.** The `bs` CLI is the
interface. JSON output goes to stdout, logs and prompts to stderr.

## Subcommands

| Command | What it does | Output |
|---|---|---|
| `$BS login` | Opens visible Chrome at Brightspace. User does USC NetID + Duo. Window auto-closes when login is detected. | `{"ok":true}` |
| `$BS status` | Headless check whether session is still valid. | `{"loggedIn":true/false}` (exit 0/1) |
| `$BS all` | All active courses + every assignment for each course (with due dates and points). **Use this for almost everything.** | `{"courses":[...],"fetchedAt":"..."}` |
| `$BS assignment <courseId> <folderId>` | Full detail for one assignment: instructions, attachments, submission type, points, rubric ref. | Raw D2L folder JSON |
| `$BS download <courseId> <folderId> <fileId> <outPath>` | Saves attachment to outPath. Creates parent dirs. `~` is expanded. | `{"ok":true,"path":"...","size":N}` |

## Step-by-step recipe for any user query

### 1. Always start with `$BS all`

```bash
$BS all
```

This gives you ALL courses + ALL assignments in ~5 seconds. Cache it in your
working memory for this turn — don't call `$BS all` twice in one response.

**If the response is `{"error":"session_expired",...}` or `$BS all` exits non-zero**:
Run `$BS login` (background it, since it waits for the user) and tell the user (中文):

> "Brightspace session 过期了。我开了浏览器窗口，请完成 USC NetID + Duo
> 推送，登录到 Brightspace 主页就好（窗口会自动关）。登好之后告诉我。"

Then wait. After they confirm, retry `$BS all`.

### 2. Filter / format / answer

- **"我有啥作业 / 这周作业 / ddl"**: Filter `assignments` by `due >= today`
  (today is in system context). Convert UTC to PT (America/Los_Angeles).
- **"X 作业具体要交什么"**: Find the `(courseId, folderId)` from `$BS all`,
  then call `$BS assignment <courseId> <folderId>` for full details. Read
  `CustomInstructions.Text`, `Attachments[]`, `SubmissionType.Name`,
  `AllowableFileType.Name`, `Assessment.ScoreDenominator`.
- **"下载 X 作业的附件"**: Call `$BS assignment` to find `Attachments[].FileId`,
  then `$BS download <courseId> <folderId> <fileId> ~/Downloads/brightspace/<course>/<assignment>/<filename>`.

### 3. Format the reply

- **Chinese for the user**, English in code/file names/commands.
- Strip USC term prefix from course names: `20261_10239 ACAD-275: Dev I` →
  `ACAD-275 Dev I`. The term code is in `code` (e.g. `10239`); USC term IDs
  decode as `20261` = Spring 2026, `20253` = Fall 2025, etc.
- Convert `due` (ISO UTC) to PT. Show as `Apr 30 (Thu) 12:00 PM`.
- For "this week", interpret as **today + 7 days** unless the user is
  obviously asking for the calendar week.
- For brief mode (single assignment), give 4 lines:
  ```
  📌 <课程> · <作业名>
  ⏰ 截止: <PT date> · 共 <points> 分 · <submission type>
  📋 要求: <摘要 1-2 句>
  📎 附件: <name1, name2 — or "无">
  ```
  Then offer to download attachments / dive deeper.

## D2L API reference (extras for future expansion)

These endpoints work with the same session (you'd extend `bs.mjs` to expose them):

- Announcements: `/d2l/api/le/1.74/{courseId}/news/`
- Grades: `/d2l/api/le/1.74/{courseId}/grades/values/myGradeValues/`
- Quizzes: `/d2l/api/le/1.74/{courseId}/quizzes/`
- Calendar: `/d2l/api/le/1.74/{courseId}/calendar/events/myCalendarEvents/`
- Content: `/d2l/api/le/1.74/{courseId}/content/root/`
- Whoami: `/d2l/api/lp/1.0/users/whoami`

## Trigger phrases (so the skill auto-fires)

- "我有什么作业 / 这周作业 / 还有几个 ddl"
- "X 作业是啥 / 具体怎么交 / 多少分"
- "下载 X 作业 / 把 PDF 下到本地"
- "Brightspace 上 / 我们 X 老师 / D2L"
- Mentions of `brightspace.usc.edu` or USC course codes (ACAD-, WRIT-, etc.)
