import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/principles'
import type { Category, Principle } from '../types'
import { CATEGORY_LABELS } from '../types'
import {
  IconActivity, IconZap, IconShield,
  IconEdit, IconX, IconInfo,
} from '../components/Icons'

const CATEGORY_CONFIG: Record<Category, {
  label: string
  activeClass: string
  inactiveClass: string
  Icon: React.FC<{ size?: number; className?: string }>
}> = {
  work: {
    label: '工作原则',
    activeClass: 'border-[#0a84ff]/30 bg-[#0a84ff]/10 text-[#0a84ff]',
    inactiveClass: 'border-white/[0.06] bg-[#121215] text-[#86868b] hover:border-white/[0.1] hover:text-[#f5f5f7]',
    Icon: IconActivity,
  },
  invest: {
    label: '投资原则',
    activeClass: 'border-[#30d158]/30 bg-[#30d158]/10 text-[#30d158]',
    inactiveClass: 'border-white/[0.06] bg-[#121215] text-[#86868b] hover:border-white/[0.1] hover:text-[#f5f5f7]',
    Icon: IconZap,
  },
  life: {
    label: '生活原则',
    activeClass: 'border-[#ff9f0a]/30 bg-[#ff9f0a]/10 text-[#ff9f0a]',
    inactiveClass: 'border-white/[0.06] bg-[#121215] text-[#86868b] hover:border-white/[0.1] hover:text-[#f5f5f7]',
    Icon: IconShield,
  },
}

export default function PrincipleEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [englishText, setEnglishText] = useState('')
  const [category, setCategory] = useState<Category>('work')
  const [source, setSource] = useState('')
  const [tags, setTags] = useState('')
  const [theme, setTheme] = useState('')
  const [changeNote, setChangeNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [original, setOriginal] = useState<Principle | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.getPrinciple(Number(id))
      .then(p => {
        setOriginal(p)
        setTitle(p.title)
        setContent(p.content)
        setEnglishText(p.english_text || '')
        setCategory(p.category)
        setSource(p.source)
        setTags(p.tags || '')
        setTheme(p.theme || '')
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      setError('标题和内容不能为空')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (isEdit && original) {
        await api.updatePrinciple(original.id, {
          title,
          content,
          english_text: englishText,
          category,
          source,
          tags,
          theme,
          change_note: changeNote,
        })
      } else {
        await api.createPrinciple({
          title,
          content,
          english_text: englishText,
          category,
          source,
          tags,
          theme,
        })
      }
      navigate('/principles')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/[0.08] border-t-[#0a84ff]" />
      </div>
    )
  }

  const inputClass =
    'w-full px-4 py-3 bg-[#121215] border border-white/[0.08] rounded-xl text-[14px] text-[#f5f5f7] placeholder:text-[#6e6e73] focus:border-[#0a84ff] focus:ring-1 focus:ring-[#0a84ff]/20 outline-none transition-all duration-300'

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-medium tracking-tighter text-[#f5f5f7]">
          {isEdit ? '修订原则' : '创建新原则'}
        </h1>
        {original && (
          <span className="text-xs text-[#6e6e73] bg-[#121215] px-2 py-0.5 rounded-lg border border-white/[0.06]">
            V{original.version}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error banner */}
        {error && (
          <div className="bg-[#ff375f]/8 border border-[#ff375f]/20 text-[#ff375f] text-sm rounded-xl p-3 flex items-center gap-2 tracking-tight">
            <IconInfo size={15} />
            {error}
          </div>
        )}

        {/* ============================================
            Category selector — three large buttons
            ============================================ */}
        <div>
          <label className="block text-[11px] text-[#6e6e73] mb-2.5 uppercase tracking-wider font-medium">
            分类
          </label>
          <div className="flex gap-2">
            {(Object.keys(CATEGORY_CONFIG) as Category[]).map(c => {
              const config = CATEGORY_CONFIG[c]
              const active = category === c
              const CatIcon = config.Icon
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm rounded-xl font-medium border transition-all duration-300 active:scale-[0.97] ${
                    active ? config.activeClass : config.inactiveClass
                  }`}
                >
                  <CatIcon size={16} />
                  {config.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-[11px] text-[#6e6e73] mb-2.5 uppercase tracking-wider font-medium">
            标题
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="原则标题"
            className={inputClass}
          />
        </div>

        {/* English text */}
        <div>
          <label className="block text-[11px] text-[#6e6e73] mb-2.5 uppercase tracking-wider font-medium">
            英文原文
          </label>
          <textarea
            value={englishText}
            onChange={e => setEnglishText(e.target.value)}
            placeholder="English original text..."
            rows={3}
            className={`${inputClass} italic resize-y`}
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-[11px] text-[#6e6e73] mb-2.5 uppercase tracking-wider font-medium">
            内容
          </label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="原则的详细内容..."
            rows={6}
            className={`${inputClass} resize-y leading-relaxed`}
          />
        </div>

        {/* Source & Theme */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] text-[#6e6e73] mb-2.5 uppercase tracking-wider font-medium">
              来源
            </label>
            <input
              type="text"
              value={source}
              onChange={e => setSource(e.target.value)}
              placeholder="如：Ray Dalio"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#6e6e73] mb-2.5 uppercase tracking-wider font-medium">
              主题模块
            </label>
            <input
              type="text"
              value={theme}
              onChange={e => setTheme(e.target.value)}
              placeholder="如：复利思维"
              className={inputClass}
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-[11px] text-[#6e6e73] mb-2.5 uppercase tracking-wider font-medium">
            标签（逗号分隔）
          </label>
          <input
            type="text"
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="如：长期,复利,决策"
            className={inputClass}
          />
        </div>

        {/* Change note (edit mode only) */}
        {isEdit && (
          <div>
            <label className="block text-[11px] text-[#6e6e73] mb-2.5 uppercase tracking-wider font-medium">
              修订说明
            </label>
            <input
              type="text"
              value={changeNote}
              onChange={e => setChangeNote(e.target.value)}
              placeholder="简述本次修订的内容"
              className={inputClass}
            />
            {original && (
              <p className="text-xs text-[#6e6e73] mt-1.5 tracking-tight">
                当前版本 V{original.version}，修改后将生成 V{original.version + 1}
              </p>
            )}
          </div>
        )}

        {/* ============================================
            Action buttons
            ============================================ */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#0a84ff] text-white text-sm font-medium rounded-xl hover:bg-[#1a8eff] transition-all duration-300 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                保存中...
              </>
            ) : (
              <>
                <IconEdit size={14} strokeWidth={2} />
                {isEdit ? '保存修订' : '创建原则'}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-white/[0.06] text-[#f5f5f7] text-sm font-medium rounded-xl border border-white/[0.08] hover:bg-white/[0.1] transition-all duration-300 active:scale-[0.97]"
          >
            <IconX size={14} />
            取消
          </button>
        </div>
      </form>
    </div>
  )
}
