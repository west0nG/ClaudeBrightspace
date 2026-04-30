# Brightspace 助手 · 给 USC 同学的 AI 课程助手

> English: [README.md](README.md)

不用再打开 Brightspace 网页一层层点了。直接问你的 AI 助手：

> "我这周有啥 ddl"
> "Dev I 那个 Final Presentations 是要交什么"
> "把 X 作业的 PDF 下到我桌面"

它就告诉你 / 帮你下。USC 登录一次 Duo，之后好几天都不用再登。

---

## 你需要准备

- 一台 **Mac 电脑**（暂时不支持 Windows）
- **Google Chrome** 浏览器（大部分人都装了。没装的话去 https://www.google.com/chrome/ 下一个）
- 你的 **USC NetID**（登 myUSC 那个）和能收 Duo 推送的手机
- 一个 **Claude 账号**（claude.ai 注册一下，免费的也行，付费 Pro 体验更好）

---

## 第一次安装 · 大概 5 分钟

### 第 1 步：打开「终端」

按住键盘 `Cmd + 空格`，弹出来的搜索框里输入 `Terminal`，回车。

你会看到一个黑色（或白色）的窗口，里面有光标在闪。这就是终端。

> 别怕。下面每一步都是**复制 → 粘贴 → 回车**。不用手打。

### 第 2 步：装 Claude Code（如果还没装）

如果你已经在用 Claude Code，跳到第 3 步。

在终端里粘贴这一行，按回车：

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

它会自动下载安装。看到提示完成后，输入：

```bash
claude
```

按回车。第一次会让你登录 Anthropic 账号（浏览器会自动打开，登一下）。登完回到终端，应该看到一个对话框。

### 第 3 步：装 Brightspace 助手

**确保你现在已经在 Claude Code 里**（终端显示一个对话提示符，等你输入）。

输入这一行（连斜杠 `/` 一起复制），按回车：

```
/plugin marketplace add west0nG/ClaudeBrightspace
```

它会问你「Are you sure?」之类，按 `Enter` 确认。

然后输入这一行：

```
/plugin install brightspace@ClaudeBrightspace
```

再次按 `Enter` 确认。

**装完之后退出再重新进 Claude Code 一次**：在 Claude Code 里输入 `/exit` 回车，然后再输 `claude` 回车进来。

### 第 4 步：第一次登录（Claude 会问你 USC NetID + 密码）

进入 Claude Code 后，直接问它一个问题——比如：

> **我这周有啥 ddl**

Claude 会发现自己没存账号密码，就在对话里问你 USC NetID 和密码。直接发给它就好。

Claude 会把它们存到本地 `.userdata/creds.json`（chmod 600，gitignore，只有你自己的 Mac 账号能读，永远不上传）。然后弹出一个 Chrome 窗口，**用户名密码已经自动填好**，让你在手机上按 Duo 推送。

手机点「**Approve**」→ 窗口自己关掉 → Claude 接着回答你最初那个问题。

**之后每次问 Brightspace 都直接出结果**。session 过期时（每隔几小时不操作就过期），Claude 会重新弹窗、自动填好用户名密码——你只需要按一下 Duo，密码再也不用打。

> 如果有点卡：地址栏是真理。还停在 `login.usc.edu` → 密码没自动填进去（少见），手动输一下继续。已经是 `brightspace.usc.edu/d2l/home` → 你已经登好了，窗口没关也没事。

---

## 💡 推荐：打开「自动确认」让对话流畅

Claude Code **默认** 每次要跑命令都会问你「让我执行这个吗？」。问一次作业 Claude 会跑 5-6 个命令（找作业 → 看详情 → 下 PDF → 读 PDF），每个都问一遍很烦。

**强烈推荐打开自动确认模式**（Claude Code 叫 "bypass permissions"）。打开后 Claude 不再问你，直接跑。

**两种打开方法，任选一个：**

### 方法 1（最简单）：启动时加个参数

每次开 Claude Code 用这个命令：

```bash
claude --dangerously-skip-permissions
```

要是嫌长，给它加个别名。在终端跑一次：

```bash
echo 'alias cl="claude --dangerously-skip-permissions"' >> ~/.zshrc
```

之后打开新终端窗口，直接 `cl` 回车就进 Claude Code 了。

### 方法 2（一劳永逸）：改配置文件

在 Claude Code 里输入 `/config`，把 permission mode 改成 `bypassPermissions`。或手动编辑 `~/.claude/settings.json`，加上这段：

```json
"permissions": {
  "defaultMode": "bypassPermissions"
}
```

### 安全说明

这个模式相当于「Claude 想跑啥就跑啥」，你给它的所有 skill / 命令都不再问你。**对这个 brightspace 助手是安全的**——它只会跑 `bs` 这一个脚本，且脚本只读 Brightspace 数据，不删东西不发送任何信息到外部。

但如果你同时用其他 skills，记得心里有数：你授权的是 Claude 整体，不是单独哪个 skill。不放心的话留默认模式，一个个点 yes 也行。

---

## 平时怎么用

进 Claude Code（终端里 `claude` 回车），直接打字问它：

| 你说 | 它做 |
|---|---|
| 我这周有啥 ddl | 列出未来 7 天截止的所有作业，按日期排好 |
| ACAD-275 Final Deliverables 是要交什么 | 显示作业要求 + 总分 + 附件列表 |
| 把 Final Requirements 那个 PDF 下到桌面 | 下载到 `~/Desktop/` |
| 给我看下我所有课 | 列出本学期 4 门课 |
| Innovators Forum 还有几个作业没交 | 列出过期 + 即将截止的 |

不需要任何特殊命令。说人话就行。

---

## 常见问题

**Q：每次都要登一次吗？**
A：不用。第一次登完之后，cookies 存在你电脑里，能用好几天。失效了 Claude 会告诉你「Brightspace session 过期了」，那时再登一次就行。

**Q：我的密码存在哪？安全吗？**
A：密码就存在你 Mac 这一个地方：`~/.claude/plugins/marketplaces/ClaudeBrightspace/skills/brightspace/.userdata/creds.json`（chmod 600，只有你自己的账号能读，gitignore）。永远不会上传到 GitHub、Anthropic 或者任何其他地方。

**唯一的代价**：第一次告诉 Claude 密码的那条消息，会经过 Anthropic 的 API（这是 Claude 读对话内容的方式）。USC 的 Duo MFA 是真正保护你的——光有密码没人能登进去，必须手机按 Duo 才行。如果你不想存，就跟 Claude 说「不要存我密码」，它就不写入文件，每次过期你自己手动输 NetID + 密码。

**Q：怎么让它忘掉我的密码？**
A：直接说「忘掉我存的 brightspace 密码」/ "forget my brightspace password"。Claude 会跑 `bs clear-creds` 把文件删掉。

**Q：登录窗口一直不关怎么办？**
A：先看地址栏是不是 `brightspace.usc.edu/d2l/home`。如果不是，回去把 Duo 走完。如果一直卡着，关掉 Claude Code 重来。

**Q：用 Safari / Edge / Brave 不行吗？**
A：现在只支持 Chrome。装一个就行，不用设默认。

**Q：能帮我**上传**作业提交吗？**
A：暂时不能（避免误操作交错文件）。只支持看作业、下附件。

**Q：Windows 能用吗？**
A：暂时不行。

**Q：其他学校的 Brightspace 能用吗？**
A：暂时只测了 USC。其他学校理论上 D2L 都长一样，把脚本里的域名改一下应该能跑——但没测过，自己折腾。

**Q：我不在 USC 上学了 / 想删掉，怎么办？**
A：在 Claude Code 里输入 `/plugin uninstall brightspace@ClaudeBrightspace`。然后删掉 `~/.claude/plugins/marketplaces/ClaudeBrightspace/skills/brightspace/.userdata/` 这个文件夹（里面是你登录的 cookies）。

---

## 给朋友推荐？

把这个发给他们就行：
**https://github.com/west0nG/ClaudeBrightspace**

让他们按这个 README 走一遍，5 分钟搞定。

---

## 反馈 / 报 bug

如果遇到问题，去 https://github.com/west0nG/ClaudeBrightspace/issues 提一下。
