import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import TodayView from './pages/TodayView'
import PrincipleList from './pages/PrincipleList'
import PrincipleDetail from './pages/PrincipleDetail'
import PrincipleEdit from './pages/PrincipleEdit'
import Customize from './pages/Customize'
import DecisionList from './pages/DecisionList'
import DecisionNew from './pages/DecisionNew'
import DecisionDetail from './pages/DecisionDetail'

export default function App() {
  return (
    <Layout>
      <Routes>
        {/* 首页 = 今日视图 */}
        <Route path="/" element={<TodayView />} />
        {/* 原则库 */}
        <Route path="/principles" element={<PrincipleList />} />
        <Route path="/principles/new" element={<PrincipleEdit />} />
        <Route path="/principles/:id" element={<PrincipleDetail />} />
        <Route path="/principles/:id/edit" element={<PrincipleEdit />} />
        {/* 定制 */}
        <Route path="/customize" element={<Customize />} />
        {/* 决策 & 复盘 (P2-P3 实现) */}
        <Route path="/decisions" element={<DecisionList />} />
        <Route path="/decisions/new" element={<DecisionNew />} />
        <Route path="/decisions/:id" element={<DecisionDetail />} />
        {/* 兜底 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
