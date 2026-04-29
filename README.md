# Brightspace 助手 · 给 USC 同学的 AI 课程助手

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

### 第 4 步：登录一次 USC（只这一次需要 Duo）

进入 Claude Code 后，直接打字告诉它：

> **帮我登录 brightspace**

它会弹出一个 Chrome 窗口，停在 USC 红色背景的登录页。你就：

1. 输入 NetID 和密码
2. 在手机 Duo App 上点「**Approve / 批准**」
3. 等浏览器自动跳到 Brightspace 主页（看到 "Welcome to Brightspace!" 那个页面）

一旦跳到主页，**那个 Chrome 窗口会自己关掉**。这就是登好了。

> 如果窗口一直不关，看一眼地址栏。如果还停在 `login.usc.edu`，说明 Duo 没批准成功，再试一次。如果地址栏已经是 `brightspace.usc.edu/d2l/home` 但窗口没关，等 5 秒，会关。

完成。从现在起好几天内你都不用再登。

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

**Q：我的密码会被传到别的地方吗？**
A：不会。所有登录都在你 Mac 上的 Chrome 里完成，密码只发给 USC 自己的服务器。Cookies 存在你电脑本地（`~/.claude/plugins/marketplaces/ClaudeBrightspace/skills/brightspace/.userdata/`），从来不上传任何地方。

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
