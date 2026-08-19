# DSH Skill 选择器 — 安装指引

## 为什么需要这个流程

插件是**动态 Cordis 插件**，激活靠 `cordis_define` + `cordis_run`。
这两个工具只有 **cordis agent preset** 的会话才有；当前会话（standard preset）没有，
所以需要在 GUI 里开一个新会话并选择 **cordis** preset，由该会话的 Agent 执行下面的指令。

激活后效果对**整个进程**生效（设置 → 通用 出现「开发 Skill」下拉框，
所有会话的 Agent 都按当前选择工作），不需要重启。

## 操作步骤（用户）

1. 在 GUI 左上角/新会话入口，**新建会话**，Agent preset 选择 **cordis**（不是 standard）。
2. 把下面的指令整段粘贴给 cordis 会话的 Agent。

## 给 cordis 会话 Agent 的指令（整段粘贴）

```
把 /root/dsh专用工作区/dsh-skill-picker/lib/host.js 的完整内容作为 code.host，
把 /root/dsh专用工作区/dsh-skill-picker/lib/client.js 的完整内容作为 code.client，
调用 cordis_define（name: "dsh-skill-picker"，purpose: "Skill 选择器：设置→通用 的「开发 Skill」下拉框，选择结果注入 system prompt"），
然后用 cordis_run 激活返回的 pluginId/packageId（mode: run）。
首次激活需要我在 UI 批准，等你看到审批卡片后再确认。
激活后告诉我结果，并说明 skill-picker/state 里扫到了哪些 skill。
```

## 激活后的验证

- 打开 **设置 → 通用**，应出现「开发 Skill」下拉框（默认 = 自动）。
- 下拉选项来自 registry + 工作区递归扫描 + （若配置 USER_HOME）用户级扫描。
- 选择某个 skill 后，后续会话的 system prompt 会注入「先加载所选 Skill」指令。

## 备注

- 动态包只在进程内存中，**DSH 重启后会消失**，需重新激活。
- 若希望跨重启永久生效，需要改走正式插件流程（本地包 + 组合 patch + 重启），
  改动较大，暂不推荐。
- `lib/host.js` 已做 **Linux 适配**：路径分隔符从 Windows 反斜杠改为 `/`
  （Windows 同样接受 `/`），并把 `USER_HOME` 设为 `/root` 以启用用户级
  `~/.dsh/skills`、`~/.agents/skills` 扫描（目录不存在时安全跳过）。
