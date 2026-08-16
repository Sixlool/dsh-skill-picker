// ============================================================
// DSH Skill 选择器 — Client 半源码（动态 Cordis 插件）
//
// 版本：pkg-15（自动中文介绍）
// 用途：作为 cordis_define 的 code.client 参数（纯函数体）
//
// 功能：
//  - settings.general.item 注册「开发 Skill」下拉框（id: skill-picker, order: 30）
//  - 选项：默认（自动）+ 全部可用 skill（带中文介绍）
//  - 中文介绍优先级：description-zh（frontmatter 扫描）> 内置映射 > 英文回退
//  - 选择后 host.call('skill-picker/set') 保存，全局生效
// ============================================================

return {
  apply(ctx) {
    const slots = ctx.get('slots')
    if (slots === undefined) return

    // Built-in fallback for skills without a description-zh field in frontmatter.
    const DESC_ZH = {
      'cordis-plugin-development': '创建/修改/调试动态 Cordis 插件（Slot、RPC、工具、版本与审批）',
      'dsh-interactive-dev-skill': '交互式开发工作流（选择题需求 → 文档先行 → 视觉预览验证）',
      'editing-cordis-compositions': '编写/校验 Cordis 组合配置（agent preset、宿主组合、realm）',
      'vision-tools': '像素级视觉操作（看图问答、定位、裁剪、取色、OCR、矢量化、抠图、截图）',
      'dsh-archive-agent-notes': '管理 Agent Notes（新增/审计/归档/恢复），执行冻结归档与清单规则',
      'dsh-code-review': '按 deepseek-harness 仓库规范审查 PR（AGENTS.md、防御模式、质量门禁）',
      'dsh-doc-site-sync': '发布/更新/迁移文档网站页面，修复 VitePress 站点与投影链接',
      'dsh-doc-standards': '文档写作规范：层级与详略、教程/参考分离、删冗长、doc 预算',
      'dsh-find-simplifications': '找代码简化机会（死代码/重复/过度设计），落成 Agent Notes 或 TODO',
      'dsh-merging-stacked-prs': '合并依赖的 PR 栈（A→B→C），要求官方 stacked-PR 特性',
      'dsh-pre-push-checks': 'push / 标记 ready 前跑最小测试与检查，避免全量套件',
      'dsh-prose-standard': '写/审/精简 Markdown、JSDoc、提示词与诊断文案',
      'dsh-translate-docs': '运行 DSH 双语文档工作流（简报、委派翻译、整篇翻译、配对核验）',
      'dsh-trim-cot-leakage': '清理像思维链泄漏的文案（死引用、变更叙述、审阅视角残留）',
      'record-browser-gif': '录制浏览器交互演示 GIF 并发布到资产分支（GUI 变更 PR 必备）',
    }

    // Display priority: description-zh (scanned from frontmatter) > built-in map > english fallback.
    const zhText = (s) => {
      if (s.descriptionZh && String(s.descriptionZh).trim()) return String(s.descriptionZh).trim()
      const known = DESC_ZH[s.name]
      if (known) return known
      if (s.description) {
        const d = String(s.description)
        return d.length > 48 ? d.slice(0, 48) + '…' : d
      }
      return '自定义 Skill'
    }

    function SkillPicker() {
      const [items, setItems] = React.useState([])
      const [selected, setSelected] = React.useState('__default__')
      React.useEffect(() => {
        host.call('skill-picker/state', {}).then((r) => {
          if (r && Array.isArray(r.skills)) setItems(r.skills)
          if (r && typeof r.selected === 'string') setSelected(r.selected)
        }).catch(() => {})
      }, [])

      const onChange = (e) => {
        const v = e.target.value
        setSelected(v)
        host.call('skill-picker/set', { skill: v }).catch(() => {})
      }

      return React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' } },
        React.createElement('span', { style: { fontSize: 13, color: 'inherit', whiteSpace: 'nowrap' } }, '开发 Skill'),
        React.createElement('select', {
          value: selected,
          onChange,
          title: '选择本次任务使用的工作 Skill（默认=AI 自动判断）',
          style: { fontSize: 13, padding: '2px 8px', borderRadius: 6, background: 'transparent', color: 'inherit', border: '1px solid rgba(128,128,128,0.45)', maxWidth: 420 },
        },
          React.createElement('option', { value: '__default__' }, '默认（自动）— AI 自动判断使用哪个 Skill'),
          items.map((s) => React.createElement('option', { key: s.name, value: s.name, title: zhText(s) }, s.name + ' — ' + zhText(s))),
        ),
      )
    }

    slots.inject('settings.general.item', () => slots.register(
      { name: 'settings.general.item', id: 'skill-picker', order: 30 },
      () => React.createElement(SkillPicker),
    ))
  },
}
