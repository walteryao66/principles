import type { Category } from '../types'

const DARK_STYLES: Record<Category, string> = {
  work: 'text-[#0a84ff] bg-[#0a84ff]/10',
  invest: 'text-[#30d158] bg-[#30d158]/10',
  life: 'text-[#ff9f0a] bg-[#ff9f0a]/10',
  constitution: 'text-[#a78bfa] bg-[#a78bfa]/10',
}

interface Props {
  theme: string
  category?: Category
  size?: 'sm' | 'md'
}

export default function ThemeBadge({ theme, category, size = 'md' }: Props) {
  const colorClass = category
    ? DARK_STYLES[category]
    : 'text-[#86868b] bg-white/[0.04]'

  const sizeClass =
    size === 'sm'
      ? 'text-[10px] px-1.5 py-0'
      : 'text-[11px] px-2 py-0.5'

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium transition-all duration-300 ${colorClass} ${sizeClass}`}
    >
      {theme}
    </span>
  )
}
