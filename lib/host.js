// ============================================================
// DSH Skill 选择器 — Host 半源码（动态 Cordis 插件）
//
// 版本：pkg-19（配置化最终版）
// 用途：作为 cordis_define 的 code.host 参数（纯函数体）
//
// 功能：
//  - systemPrompt.section 注册「skill-selection」段落（text provider），
//    选择结果动态注入每次组装：让 Agent 先加载所选 skill 再开工
//  - RPC：
//      skill-picker/state  返回 { selected, skills: [{name, description, descriptionZh}] }
//      skill-picker/set    保存选择（进程级共享）
//  - 扫描来源（合并去重，按 name 排序）：
//      1. skills 服务 registry 视图（全局层，双 key 避免过期缓存）
//      2. 用户级：USER_HOME 配置（~/.dsh/skills、~/.agents/skills）
//      3. 项目/仓库级：从 sandboxPolicy.workspaceRoot 递归发现
//         .dsh/skills 与 .agents/skills（深度 6，跳过 node_modules/.git）
//  - 中文介绍：读取 SKILL.md frontmatter 的 description-zh 字段
// ============================================================

return {
  apply(ctx) {
    // ---- 配置区 ----
    // 用户主目录：设为你的 home（如 'C:\\Users\\你的用户名'）以启用用户级
    // skill 扫描（~/.dsh/skills、~/.agents/skills）。受限运行时无法自动探测
    // home（无 process、'~' 不展开），留空则跳过用户级扫描。
    const USER_HOME = ''

    let selected = '__default__'

    const sp = ctx.get('systemPrompt')
    if (sp !== undefined && typeof sp.section === 'function') {
      sp.section({
        name: 'skill-selection',
        order: 200,
        text: () => {
          const name = selected
          if (!name || name === '__default__') return ''
          return '用户选择的工作 Skill 是 `' + name + '`。开始处理任务前，请先调用 skill 工具加载 `' + name + '` 并遵循它的完整指令；如果该 skill 与当前任务无关，请说明你未使用它。'
        },
      })
    }

    const parseFrontmatter = (text) => {
      if (typeof text !== 'string' || text.slice(0, 3) !== '---') return null
      const end = text.indexOf('\n---', 4)
      if (end < 0) return null
      const fm = text.slice(4, end)
      const name = /^name:\s*(.+)$/m.exec(fm)
      const desc = /^description:\s*(.+)$/m.exec(fm)
      const descZh = /^description-zh:\s*(.+)$/m.exec(fm)
      if (!name || !name[1]) return null
      return {
        name: name[1].trim(),
        description: desc && desc[1] ? desc[1].trim() : '',
        descriptionZh: descZh && descZh[1] ? descZh[1].trim() : '',
      }
    }

    const sortByName = (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)

    const scanSkillDir = async (fs, root) => {
      const out = []
      let rootTarget
      try {
        rootTarget = await fs.resolve(root)
      } catch (_) {
        return out
      }
      let entries = []
      try {
        entries = await fs.listDir(rootTarget)
      } catch (_) {
        return out
      }
      for (const entry of entries) {
        const dirName = entry && entry.name ? String(entry.name) : ''
        if (!dirName) continue
        try {
          const skillTarget = await fs.resolve(root + '\\' + dirName + '\\SKILL.md')
          const text = await fs.readText(skillTarget)
          const fm = parseFrontmatter(text)
          if (fm && fm.name) out.push(fm)
        } catch (_) {}
      }
      return out
    }

    const collectSkillRoots = async (fs, base, parentName, depth, out) => {
      if (depth <= 0) return
      let entries = []
      try {
        entries = await fs.listDir(await fs.resolve(base))
      } catch (_) {
        return
      }
      for (const entry of entries) {
        const name = entry && entry.name ? String(entry.name) : ''
        if (!name) continue
        if (name === 'skills' && (parentName === '.agents' || parentName === '.dsh')) {
          out.push(base + '\\' + name)
          continue
        }
        if (name === 'node_modules' || name === '.git') continue
        await collectSkillRoots(fs, base + '\\' + name, name, depth - 1, out)
      }
    }

    harness.handle('skill-picker/state', async () => {
      const seen = new Map()
      const add = (name, description, descriptionZh) => {
        if (!name || seen.has(name)) return
        seen.set(name, { name, description: description || '', descriptionZh: descriptionZh || '' })
      }

      // 1) Registry views (global layer; scoped preset skills are not visible here).
      const skills = ctx.get('skills')
      if (skills !== undefined && typeof skills.list === 'function') {
        for (const opts of [{}, (() => { const s = ctx.get('sandboxPolicy'); return { cwd: s && s.workspaceRoot ? s.workspaceRoot : undefined } })()]) {
          try {
            const summaries = await skills.list(opts)
            for (const s of summaries) {
              if (s && s.name) add(s.name, s.description || '')
            }
          } catch (_) {}
        }
      }

      // 2) Filesystem scan: configured user home + recursive workspace discovery.
      const fs = ctx.get('fs')
      if (fs !== undefined && typeof fs.resolve === 'function') {
        const roots = []
        if (USER_HOME) {
          roots.push(USER_HOME + '\\.dsh\\skills', USER_HOME + '\\.agents\\skills')
        }
        const sp = ctx.get('sandboxPolicy')
        const workspace = sp && sp.workspaceRoot ? sp.workspaceRoot : null
        if (workspace) {
          roots.push(workspace + '\\.dsh\\skills', workspace + '\\.agents\\skills')
          await collectSkillRoots(fs, workspace, '', 6, roots)
        }
        for (const root of roots) {
          try {
            const found = await scanSkillDir(fs, root)
            for (const s of found) add(s.name, s.description, s.descriptionZh)
          } catch (_) {}
        }
      }

      const list = Array.from(seen.values()).sort(sortByName)
      return { selected, skills: list }
    })

    harness.handle('skill-picker/set', (args) => {
      const skill = args && typeof args.skill === 'string' && args.skill ? args.skill : '__default__'
      selected = skill
      return { ok: true }
    })
  },
}
