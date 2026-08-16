# 🎛️ DSH Skill Picker（Skill 选择器）

在 DeepSeek Harness **设置 → 通用** 里加一个「开发 Skill」下拉框，让你在**任何会话**都能选择本次任务使用哪个 Skill（或保持默认自动判断），选择结果注入 system prompt，Agent 会先加载所选 Skill 再开工。

## ✨ 功能

| 功能 | 说明 |
|---|---|
| 🎯 **全局选择** | 一个下拉框，所有会话的 Agent 都按当前选择工作（进程级共享） |
| 📜 **自动扫描** | 装上即扫描 6 个 skill 根：用户 `~/.dsh/skills`、`~/.agents/skills`、项目/仓库的 `.dsh/skills`、`.agents/skills`，加上 registry 双视图 |
| 🇨🇳 **自动中文介绍** | 读取 SKILL.md frontmatter 的 `description-zh` 字段；无则用内置映射；再回退英文描述 |
| 💉 **Prompt 注入** | 选择非默认时，system prompt 增加"先加载所选 Skill 并遵循其指令" |
| ⚡ **零配置** | 动态 Cordis 插件，无需重启、无需 API Key |

## 🚀 用法（动态插件）

在 DSH 会话中让 Agent 执行：

1. 把 `lib/host.js` 内容作为 `cordis_define` 的 `code.host`
2. 把 `lib/client.js` 内容作为 `code.client`
3. 用 `cordis_run` 激活（首次需在 UI 批准）
4. 打开 **设置 → 通用**，找到「开发 Skill」下拉框

## 📐 Skill 中文介绍约定

给任意 skill 的 `SKILL.md` frontmatter 加上 `description-zh`，下拉框即自动显示中文：

```yaml
---
name: my-skill
description: 'English description...'
description-zh: '中文介绍'
---
```

> ⚠️ 注意：frontmatter 值若含 `冒号+空格`（如 `workflow: xxx`）必须用引号包裹，否则 YAML 解析失败、skill 会被 DSH 忽略。

## 🗂️ 扫描范围

插件自动扫描以下 skill 来源并合并去重：

- **registry 双视图**：DSH skills 服务（当前作用域 + 工作区视图）
- **用户级**：`~/.dsh/skills`（即 `$DSH_HOME/skills`）、`~/.agents/skills`
- **项目级**：工作区与仓库根下的 `.dsh/skills`、`.agents/skills`

> 具体扫描路径定义在 `lib/host.js` 的 `roots` 数组（含 `$HOME` 与工作区基准的相对拼接）。
> 部署到新机器时，按该机器的 `$DSH_HOME` 与仓库位置调整 `roots` 即可，无需改其他代码。

## 📄 License

[MIT](./LICENSE)
