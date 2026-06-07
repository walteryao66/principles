import { ReactNode, useEffect, useState } from 'react'
import { NavLink, useLocation, Link } from 'react-router-dom'
import {
  IconDashboard, IconList, IconEdit, IconDoc,
  IconZap, IconBook, IconRuler, IconPen,
  IconHome, IconClipboard, IconStar,
} from './Icons'

interface NavItem {
  to: string
  label: string
  Icon: React.FC<{ size?: number; className?: string }>
}

const navItems: NavItem[] = [
  { to: '/', label: '今日', Icon: IconHome },
  { to: '/principles', label: '原则库', Icon: IconBook },
  { to: '/decisions', label: '决策', Icon: IconClipboard },
  { to: '/customize', label: '定制', Icon: IconStar },
]

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ============================================
          顶部导航 — 极简 Apple 风格
          ============================================ */}
      <header className="fixed top-0 inset-x-0 z-50 bg-black/75 backdrop-blur-2xl border-b border-white/[0.07]">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-12 px-5">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-[0_2px_12px_rgba(10,132,255,0.35)] group-hover:shadow-[0_2px_20px_rgba(10,132,255,0.5)] transition-shadow">
              <IconBook size={14} className="text-white" strokeWidth={2.2} />
            </div>
            <span className="text-[14px] font-semibold tracking-tight text-[#f5f5f7] hidden sm:block">
              Principles
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map(item => {
              const active = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium rounded-lg transition-all duration-200 ${
                    active
                      ? 'text-white bg-white/[0.08]'
                      : 'text-[#86868b] hover:text-[#c7c7cc] hover:bg-white/[0.04]'
                  }`}
                >
                  <item.Icon size={16} />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          {/* Right CTA */}
          <Link
            to="/decisions/new"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium text-white bg-[#0a84ff] rounded-lg hover:bg-[#1a8eff] transition-colors shadow-[0_0_16px_rgba(10,132,255,0.25)]"
          >
            <IconPen size={14} />
            <span className="hidden sm:inline">记录决策</span>
          </Link>
        </div>
      </header>

      {/* ============================================
          主体 — 全幅 + 精密留白
          ============================================ */}
      <div className="pt-12 pb-24 md:pb-8">
        <main className="max-w-5xl mx-auto px-5 sm:px-8 py-8">
          <div className="animate-[fadeIn_0.35s_ease-out]">{children}</div>
        </main>
      </div>

      {/* ============================================
          移动端底部导航
          ============================================ */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-black/85 backdrop-blur-2xl border-t border-white/[0.07]">
        <div className="flex justify-around py-1.5 px-2">
          {navItems.map(item => {
            const active = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg min-w-[60px] transition-all ${
                  active ? 'text-[#0a84ff]' : 'text-[#6e6e73]'
                }`}
              >
                <item.Icon size={20} />
                <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
