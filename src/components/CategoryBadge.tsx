import type { Category } from '../types'
import { CATEGORY_LABELS } from '../types'

const DARK_STYLES: Record<Category, string> = {
  work: 'text-[#0a84ff] bg-[#0a84ff]/10',
  invest: 'text-[#30d158] bg-[#30d158]/10',
  life: 'text-[#ff9f0a] bg-[#ff9f0a]/10',
}

export default function CategoryBadge({ category }: { category: Category }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium transition-all duration-300 ${DARK_STYLES[category]}`}
    >
      {CATEGORY_LABELS[category]}
    </span>
  )
}
