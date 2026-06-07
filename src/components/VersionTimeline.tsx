import type { PrincipleVersion } from '../types'

export default function VersionTimeline({ versions }: { versions: PrincipleVersion[] }) {
  if (versions.length === 0) {
    return (
      <p className="text-sm text-[#6e6e73] py-4 text-center">
        暂无版本历史
      </p>
    )
  }

  const sorted = [...versions].sort((a, b) => b.version_number - a.version_number)

  return (
    <div className="space-y-0">
      {sorted.map((v, i) => (
        <div key={v.id} className="flex gap-3">
          {/* Timeline marker */}
          <div className="flex flex-col items-center pt-0.5">
            <div
              className={`w-2.5 h-2.5 rounded-full border-2 transition-all duration-300 ${
                i === 0
                  ? 'bg-[#0a84ff] border-[#0a84ff]'
                  : 'bg-[#161618] border-white/[0.1]'
              }`}
            />
            {i < sorted.length - 1 && (
              <div className="w-px flex-1 bg-white/[0.06] mt-0.5 min-h-[24px]" />
            )}
          </div>

          {/* Content */}
          <div className={i < sorted.length - 1 ? 'pb-4' : ''}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium tracking-tight text-[#f5f5f7]">
                V{v.version_number}
              </span>
              {i === 0 && (
                <span className="text-[10px] bg-[#30d158]/15 text-[#30d158] px-1.5 py-0.5 rounded font-medium">
                  当前版本
                </span>
              )}
            </div>
            {v.change_note && (
              <p className="text-xs text-[#86868b] mt-0.5 leading-relaxed">
                {v.change_note}
              </p>
            )}
            <p className="text-xs text-[#6e6e73] mt-0.5">
              {new Date(v.created_at).toLocaleString('zh-CN')}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
