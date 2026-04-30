# Brightspace Assistant · An AI course helper for USC students

> 中文版: [README.zh.md](README.zh.md)

Stop clicking through Brightspace pages. Just ask your AI assistant:

> "What's due this week?"
> "What does the Dev I Final Presentations actually need?"
> "Save the PDF for assignment X to my desktop."

It tells you / does it for you. One Duo login at USC, and you're set for days.

---

## What you need

- A **Mac** (Windows not supported yet)
- **Google Chrome** (most people have it. If not, grab it at https://www.google.com/chrome/)
- Your **USC NetID** (the one for myUSC) and a phone that gets Duo push notifications
- A **Claude account** (sign up at claude.ai — free works, paid Pro is smoother)

---

## First-time setup · about 5 minutes

### Step 1: Open Terminal

Press `Cmd + Space`, type `Terminal` in the search box, hit Enter.

You'll see a black (or white) window with a blinking cursor. That's the terminal.

> Don't worry. Every step below is **copy → paste → Enter**. No typing required.

### Step 2: Install Claude Code (if you haven't)

If you're already using Claude Code, skip to Step 3.

Paste this into the terminal and hit Enter:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

It downloads and installs automatically. When it's done, type:

```bash
claude
```

Hit Enter. The first time it'll ask you to log into your Anthropic account (a browser will open automatically — log in there). Once you're back in the terminal, you should see a chat prompt.

### Step 3: Install the Brightspace assistant

**Make sure you're inside Claude Code now** (the terminal shows a chat prompt waiting for input).

Type this line (include the leading `/`) and hit Enter:

```
/plugin marketplace add west0nG/ClaudeBrightspace
```

It'll ask "Are you sure?" or similar — press `Enter` to confirm.

Then type:

```
/plugin install brightspace@ClaudeBrightspace
```

Press `Enter` to confirm again.

**After it's done, exit and re-enter Claude Code once**: type `/exit` and Enter, then `claude` and Enter to come back in.

### Step 4: First login (Claude asks for your USC NetID + password)

Inside Claude Code, just ask it something — for example:

> **what's due this week**

Claude will notice it doesn't have your credentials yet and ask for your USC NetID and password right in the chat. Send them.

Claude saves them locally to `.userdata/creds.json` (chmod 600, gitignored — only readable by your Mac account, never uploaded). Then it pops a Chrome window with NetID + password **already filled in for you**, and asks you to approve the Duo push on your phone.

Tap **Approve** in Duo → window auto-closes → Claude answers your original question.

**From now on, every Brightspace question Just Works.** When the session expires (every few hours of inactivity), Claude reopens the login window with your credentials pre-filled — you only ever tap Duo, never type your password again.

> If something feels stuck: the address bar is the source of truth. If it's still on `login.usc.edu`, the password didn't submit (rare) — type it manually and continue. If it's already on `brightspace.usc.edu/d2l/home`, you're logged in even if the window hasn't closed yet.

---

## 💡 Recommended: turn on "auto-confirm" for smoother chats

Claude Code **by default** asks "Let me run this?" every time it wants to execute a command. One assignment question makes Claude run 5–6 commands (find assignment → check details → download PDF → read PDF), and it asks for each one. Annoying.

**Strongly recommend turning on auto-confirm mode** (Claude Code calls it "bypass permissions"). After turning it on, Claude stops asking and just runs.

**Two ways to enable it — pick either:**

### Option 1 (simplest): pass a flag at startup

Open Claude Code with this command every time:

```bash
claude --dangerously-skip-permissions
```

If that's too long, set up an alias. Run this once in the terminal:

```bash
echo 'alias cl="claude --dangerously-skip-permissions"' >> ~/.zshrc
```

After that, open a new terminal window and just type `cl` + Enter to launch Claude Code.

### Option 2 (set-and-forget): edit the config file

In Claude Code, type `/config` and change permission mode to `bypassPermissions`. Or manually edit `~/.claude/settings.json` and add:

```json
"permissions": {
  "defaultMode": "bypassPermissions"
}
```

### Safety note

This mode means "Claude can run anything it wants" — every skill / command you've given it stops asking. **For this Brightspace assistant, it's safe** — it only ever runs the `bs` script, which is read-only against Brightspace. It doesn't delete anything or send any data anywhere.

But if you use other skills too, just be aware: you're authorizing Claude as a whole, not individual skills. If you're not comfortable, leave the default mode and click "yes" each time — that works too.

---

## How to use it day-to-day

Open Claude Code (`claude` + Enter in the terminal), and just type to it:

| You say | It does |
|---|---|
| What's due this week? | Lists every assignment due in the next 7 days, sorted by date |
| What does ACAD-275 Final Deliverables need? | Shows the requirements + total points + attachments |
| Save the Final Requirements PDF to my desktop | Downloads it to `~/Desktop/` |
| Show me all my classes | Lists the 4 courses you're in this semester |
| How many Innovators Forum assignments are still open? | Lists the overdue + upcoming ones |

No special commands needed. Just talk normally.

---

## FAQ

**Q: Do I have to log in every time?**
A: Nope. After the first login, cookies are stored locally on your Mac and last for several days. When they expire, Claude will tell you "Brightspace session expired" — log in once more then.

**Q: Where is my password stored, and is it safe?**
A: Your password lives in one place on your Mac: `~/.claude/plugins/marketplaces/ClaudeBrightspace/skills/brightspace/.userdata/creds.json` (chmod 600 — readable only by your account, gitignored). It's never uploaded to GitHub, Anthropic, or anywhere else from your machine.

The one trade-off you're accepting: when you tell Claude your password the first time, that message does pass through Anthropic's API as part of the conversation (that's how Claude reads anything you type). USC's Duo MFA is what actually protects you — even with the password, no one can log in without approving Duo on your phone. If you'd rather skip saving entirely, just say "don't save my password" and Claude will leave creds.json empty; you'll type NetID + password manually each time the session expires.

**Q: How do I tell it to forget my password?**
A: Just say "forget my brightspace password" / "删掉我存的密码". Claude runs `bs clear-creds` and the file is deleted.

**Q: The login window won't close. What now?**
A: First check the address bar — is it on `brightspace.usc.edu/d2l/home`? If not, finish the Duo flow. If it's stuck, quit Claude Code and start over.

**Q: Can I use Safari / Edge / Brave instead?**
A: Right now only Chrome works. Just install it — you don't need to make it your default.

**Q: Can it submit assignments for me?**
A: Not yet (to avoid accidentally submitting the wrong file). Read-only for now: viewing assignments + downloading attachments.

**Q: Does it work on Windows?**
A: Not yet.

**Q: Can it work for other schools' Brightspace?**
A: Only tested at USC. Other schools' D2L should look similar — change the domain in the script and it might work — but untested, you're on your own.

**Q: I'm not at USC anymore / I want to remove it. How?**
A: In Claude Code, type `/plugin uninstall brightspace@ClaudeBrightspace`. Then delete the folder `~/.claude/plugins/marketplaces/ClaudeBrightspace/skills/brightspace/.userdata/` (that's where your login cookies sit).

---

## Recommend it to a friend?

Just send them this:
**https://github.com/west0nG/ClaudeBrightspace**

Have them follow this README — 5 minutes and they're done.

---

## Feedback / bug reports

If something breaks, file it at https://github.com/west0nG/ClaudeBrightspace/issues.
