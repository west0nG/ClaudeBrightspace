# ClaudeBrightspace

USC Brightspace assistant for Claude Code. Ask Claude things like *"我有啥作业"*,
*"那个 Final Deliverables 具体要交什么"*, or *"下载 X 作业的 PDF"* — and it
pulls real-time data from your USC Brightspace via the D2L Valence API.

One Duo login lasts ~days; afterwards every query is silent and instant.

## Install

```bash
# In Claude Code
/plugin marketplace add west0nG/ClaudeBrightspace
/plugin install brightspace@ClaudeBrightspace
```

Restart Claude Code, then run once:

```bash
~/.claude/plugins/marketplaces/ClaudeBrightspace/skills/brightspace/bs login
```

A Chrome window opens at the USC SSO page. Do NetID + password + Duo, and the
window auto-closes when login is detected. Done.

## Requirements

- macOS
- Google Chrome installed
- Node.js 18+ (Claude Code already ships this)
- A USC NetID

The first invocation auto-installs `playwright` (~15 MB, no Chromium download —
uses your system Chrome).

## Usage (you talk, Claude runs `bs`)

- "我这周有啥 ddl"
- "ACAD-275 那个 Final Deliverables 是要交什么"
- "把 Final Requirements PDF 下到我桌面"
- "Brightspace 课程列表给我看一眼"

## How it works

| Layer | What it does |
|---|---|
| `SKILL.md` | Tells Claude when to fire and which subcommand to call |
| `bs` (bash) | Auto-installs deps on first run, dispatches to `bs.mjs` |
| `bs.mjs` (Node) | Launches your Chrome via Playwright, hits the D2L Valence API, prints JSON |
| `.userdata/storageState.json` | Cookies + storage (gitignored, per-user, lives ~days) |

Session persistence uses Playwright's `storageState` JSON, which captures
session cookies that Chrome's user-data-dir does not persist.

## Direct CLI usage

```bash
PLUGIN=~/.claude/plugins/marketplaces/ClaudeBrightspace/skills/brightspace
$PLUGIN/bs login                            # one-time
$PLUGIN/bs status                            # check session
$PLUGIN/bs all                               # all courses + assignments
$PLUGIN/bs assignment <courseId> <folderId>  # detail
$PLUGIN/bs download <courseId> <folderId> <fileId> <outPath>
```

## Privacy

- `.userdata/storageState.json` is local to your Mac, never synced.
- The script only talks to `brightspace.usc.edu` and the SSO endpoints
  Brightspace redirects through.
- Read-only — no upload/submission paths are implemented.

## License

MIT
