---
name: brightspace
description: USC Brightspace (D2L) assistant. Use when the user asks about their USC homework, assignments, coursework, deadlines, due dates, what's due, what an assignment requires, downloading assignment files, course list, or anything involving brightspace.usc.edu / D2L. Triggers in English ("what's due", "what assignments do I have", "deadlines this week", "download X assignment") and Chinese ("有啥作业", "X作业是啥", "ddl") alike.
user-invocable: true
disable-model-invocation: false
---

# Brightspace skill

Conversational query layer over USC Brightspace. Designed for USC students —
both Chinese-speaking and English-speaking. The user asks Claude things like
"what's due this week / what does assignment X require / download the PDF
for Y" or "我有啥作业 / 这周还有几个 ddl / X 作业具体要交什么 / 下载 Y 的附件",
and Claude answers by calling the local `bs` CLI (Node + Playwright +
system Chrome). Session persists across Claude Code restarts via a
storageState JSON file at `<skill>/.userdata/storageState.json`.

## Language policy

**Mirror the user's language.** This skill serves both 中文 and English USC
students. Detect the language of the user's most recent message and reply in
that language:

- User writes in Chinese → reply in Chinese.
- User writes in English → reply in English.
- Mixed (e.g. "ACAD-275 那个 final 是啥") → follow the dominant natural-language
  words, not the course codes. Course codes, file names, commands, JSON keys
  always stay English regardless.

If the user has a global instruction in CLAUDE.md that pins a language (e.g.
"always reply in Chinese"), that overrides this skill's mirroring — user
instructions always win.

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
| `$BS login` | Opens visible Chrome. **If creds are saved, auto-fills NetID + password — user only approves Duo.** Otherwise the user fills everything manually. Window auto-closes when login is detected. | `{"ok":true}` |
| `$BS status` | Headless check whether session is still valid. | `{"loggedIn":true/false}` (exit 0/1) |
| `$BS all` | All active courses + every assignment for each course (with due dates and points). **Use this for almost everything.** | `{"courses":[...],"fetchedAt":"..."}` |
| `$BS assignment <courseId> <folderId>` | Full detail for one assignment: instructions, attachments, submission type, points, rubric ref. | Raw D2L folder JSON |
| `$BS download <courseId> <folderId> <fileId> [outPath]` | Saves attachment. **`outPath` is optional — defaults to `~/Downloads/<filename>`** (Chrome-style). Pass an explicit path to override. Creates parent dirs. `~` is expanded. | `{"ok":true,"path":"...","size":N}` |
| `$BS creds-status` | Whether NetID + password are saved locally. | `{"hasCreds":bool,"netid":"..."}` |
| `$BS set-creds` | Reads JSON `{"netid":"...","password":"..."}` from stdin and writes `.userdata/creds.json` (chmod 600). | `{"ok":true,"netid":"..."}` |
| `$BS clear-creds` | Deletes saved credentials. Use if the user changes password or asks to forget. | `{"ok":true}` |

## Step-by-step recipe for any user query

### 1. Always start with `$BS all`

```bash
$BS all
```

This gives you ALL courses + ALL assignments in ~5 seconds. Cache it in your
working memory for this turn — don't call `$BS all` twice in one response.

**If the response is `{"error":"session_expired",...}` or `$BS all` exits non-zero**,
follow this branching flow:

#### Step 1.1 — Check whether credentials are saved

```bash
$BS creds-status
```

#### Step 1.2a — `hasCreds: false` → ask the user once, then save

Ask the user in their language for their USC NetID and password. Say what
you'll do with them: store locally in `.userdata/creds.json` (chmod 600,
gitignored) so future logins are automatic. Make clear that the password
**alone cannot log in** — Duo MFA is still required, so the saved password
on its own is not sufficient to access their account.

Sample prompt:

- Chinese:
  > "我没有存你的 USC NetID 和密码，所以每次都要手动登。如果你愿意告诉我，
  > 我会存到本地（`.userdata/creds.json`，权限 600，gitignore 了），以后只
  > 需要你按 Duo 推送就行。密码本身没用——Duo MFA 是另一道关卡。
  > 要存吗？告诉我 NetID + password 就好。"
- English:
  > "I don't have your USC NetID + password saved, so every login needs to
  > be manual. If you share them I'll store them locally
  > (`.userdata/creds.json`, chmod 600, gitignored) so future logins are
  > automatic — you'd only need to approve Duo. The password alone can't
  > log in (Duo MFA is still required). Want me to save them? Just send
  > NetID and password."

When the user replies with credentials, save them via stdin (do **not** put
the password on the command line — it would land in shell history / `ps`):

```bash
$BS set-creds <<'EOF'
{"netid":"<their NetID>","password":"<their password>"}
EOF
```

If the user declines, skip to Step 1.3 and let them log in manually.

#### Step 1.2b — `hasCreds: true` → just proceed

Skip directly to Step 1.3.

#### Step 1.3 — Run login (auto-fills if creds exist)

Background `$BS login` (it blocks until the user finishes Duo) and tell them
to look at the browser window:

- Chinese (creds saved):
  > "我帮你打开了登录窗口，NetID 和密码我已经自动填了。你只需要在手机上按
  > 一下 Duo 推送就好，窗口会自动关。"
- Chinese (no creds):
  > "我帮你打开了登录窗口。请输入 USC NetID + 密码 + 按 Duo 推送，登好之后
  > 窗口会自动关。"
- English (creds saved):
  > "I opened the login window and pre-filled your NetID + password. Just
  > approve the Duo push on your phone — the window will auto-close."
- English (no creds):
  > "I opened the login window. Enter your USC NetID + password, approve
  > Duo on your phone, and the window will auto-close."

After the background `$BS login` finishes, retry `$BS all`.

#### When to clear creds

- The user reports that auto-login is failing repeatedly (e.g., password
  changed at USC). Run `$BS clear-creds` and offer to save the new one.
- The user says "forget my password" / "删掉我的密码" / similar.

### 2. Filter / format / answer

- **List mode** ("what's due / this week's assignments / ddls" /
  "我有啥作业 / 这周作业 / ddl"): Filter `assignments` by `due >= today`
  (today is in system context). Convert UTC to PT (America/Los_Angeles).
- **Brief mode** ("what does X require / how do I submit / what's it worth" /
  "X 作业具体要交什么 / 怎么做 / 要求是啥"): Don't just read the short
  `CustomInstructions.Text` — the real requirements usually live in attached
  PDFs (rubrics, prompts, requirements docs). Workflow:
  1. `$BS assignment <courseId> <folderId>` → get JSON
  2. **For each item in `Attachments[]`**, run `$BS download <courseId>
     <folderId> <fileId>` (no outPath → drops into `~/Downloads/`)
  3. **Use the `Read` tool on each downloaded PDF/doc** to get the full text
  4. Synthesize a plain-language answer combining `CustomInstructions.Text`
     + PDF contents + `SubmissionType` + `Assessment.ScoreDenominator`. The
     user wants ONE clean explanation, not a dump of raw fields.

  Skip auto-download only if there are no attachments, or if the user is
  obviously just asking for ddl/points (use brief 4-line format then).

- **Download mode** ("download X's attachment" / "下载 X 作业的附件"): Call
  `$BS assignment` to find `Attachments[].FileId`, then `$BS download
  <courseId> <folderId> <fileId>` (drops into `~/Downloads/<filename>`).
  Only pass an explicit outPath if the user asks for a specific location like
  "下到我桌面" / "save to my desktop" → `~/Desktop/<filename>`.

### 3. Format the reply

- **Reply in the user's language** (see Language policy above). Code, file
  names, commands, and course codes always stay English.
- Strip USC term prefix from course names: `20261_10239 ACAD-275: Dev I` →
  `ACAD-275 Dev I`. The term code is in `code` (e.g. `10239`); USC term IDs
  decode as `20261` = Spring 2026, `20253` = Fall 2025, etc.
- Convert `due` (ISO UTC) to PT. Show as `Apr 30 (Thu) 12:00 PM`.
- For "this week" / "这周", interpret as **today + 7 days** unless the user
  is obviously asking for the calendar week.
- For brief mode (single assignment), give 4 lines. Pick the template that
  matches the user's language:

  Chinese:
  ```
  📌 <课程> · <作业名>
  ⏰ 截止: <PT date> · 共 <points> 分 · <submission type>
  📋 要求: <摘要 1-2 句>
  📎 附件: <name1, name2 — or "无">
  ```

  English:
  ```
  📌 <course> · <assignment name>
  ⏰ Due: <PT date> · <points> pts · <submission type>
  📋 Requirements: <1–2 sentence summary>
  📎 Attachments: <name1, name2 — or "none">
  ```

  Then offer to download attachments / dive deeper, in the same language.

## Extending bs.mjs

The same authenticated session works for any D2L Valence endpoint. To expose
more (grades, quizzes, calendar, etc.), copy the `cmdAssignment` pattern in
`bs.mjs` and point at the relevant `/d2l/api/le/1.74/{courseId}/...` path.
