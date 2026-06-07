import { Link } from 'react-router-dom'
import type { Principle } from '../types'
import CategoryBadge from './CategoryBadge'
import ThemeBadge from './ThemeBadge'
import { IconStar, IconCheck } from './Icons'

export default function PrincipleCard({ principle }: { principle: Principle }) {
  const isDeprecated = principle.status === 'deprecated'

  return (
    <Link
      to={`/principles/${principle.id}`}
      className={`block bg-[#161618] border border-white/[0.06] rounded-2xl p-5
        hover:bg-[#1c1c1f] hover:border-white/[0.1]
        transition-all duration-300 group
        ${isDeprecated ? 'opacity-50' : ''}
        ${principle.is_personalized ? 'border-l-2 border-l-[#30d158]' : ''}`}
    >
      {/* Top badges */}
      <div className="flex items-center flex-wrap gap-1.5 mb-2.5">
        <CategoryBadge category={principle.category} />
        {principle.theme && (
          <ThemeBadge theme={principle.theme} category={principle.category} size="sm" />
        )}
        {isDeprecated && (
          <span className="inline-flex items-center px-1.5 py-0 text-[10px] rounded-full bg-white/[0.04] text-[#6e6e73] border border-white/[0.06]">
            已汰换
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-[15px] font-medium tracking-tight text-[#f5f5f7] group-hover:text-white mb-1.5 truncate transition-colors duration-300">
        {principle.title}
      </h3>

      {/* Content preview */}
      <p className="text-[13px] text-[#86868b] line-clamp-2 mb-1.5 leading-relaxed">
        {principle.content}
      </p>

      {/* English text preview */}
      {principle.english_text && (
        <p className="text-[12px] text-[#6e6e73] italic line-clamp-1 mb-2">
          {principle.english_text}
        </p>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between text-[12px] text-[#6e6e73] mt-2 pt-2 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span>{principle.source || '-'}</span>
          <span className="text-[#48484d]">·</span>
          <span>V{principle.version}</span>
        </div>
        <div className="flex items-center gap-2">
          {principle.relevance > 0 && (
            <span className="flex items-center gap-0.5 text-[#ff9f0a]">
              {Array.from({ length: principle.relevance }, (_, i) => (
                <IconStar key={i} size={11} filled />
              ))}
            </span>
          )}
          {principle.is_personalized && (
            <span className="text-[#30d158]" title="已定制">
              <IconCheck size={14} strokeWidth={2.5} />
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
