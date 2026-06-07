import { useEffect, useState } from 'react'
import { api } from '../api/principles'

export default function Export() {
  const [mdPreview, setMdPreview] = useState('')
  const [htmlPreview, setHtmlPreview] = useState('')
  const [activeTab, setActiveTab] = useState<'pdf' | 'md'>('pdf')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.getPdfPreview(),
      api.getMarkdownPreview(),
    ])
      .then(([html, md]) => {
        setHtmlPreview(html)
        setMdPreview(md)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h2 className="text-xl font-bold text-gray-900">导出个人原则规范</h2>

      {/* Export buttons */}
      <div className="flex flex-wrap gap-3">
        <a
          href={api.getExportPdfUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          下载 PDF
        </a>
        <a
          href={api.getExportMarkdownUrl()}
          download
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          下载 Markdown
        </a>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('pdf')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'pdf' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          PDF 预览
        </button>
        <button
          onClick={() => setActiveTab('md')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'md' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Markdown 预览
        </button>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {activeTab === 'pdf' ? (
          <iframe
            srcDoc={htmlPreview}
            className="w-full h-[600px] border-0"
            title="PDF Preview"
          />
        ) : (
          <pre className="p-6 text-sm text-gray-700 font-mono whitespace-pre-wrap overflow-auto max-h-[600px]">
            {mdPreview}
          </pre>
        )}
      </div>
    </div>
  )
}
