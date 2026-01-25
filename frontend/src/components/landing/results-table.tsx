interface MetricComparison {
  metric: string
  before: string
  after: string
  improvement: string
}

interface ResultsTableProps {
  metrics: MetricComparison[]
}

export default function ResultsTable({ metrics }: ResultsTableProps) {
  return (
    <div className="max-w-4xl mx-auto overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="px-6 py-4 text-left text-slate-400 font-semibold">지표</th>
            <th className="px-6 py-4 text-left text-slate-400 font-semibold">Before</th>
            <th className="px-6 py-4 text-left text-slate-400 font-semibold">After</th>
            <th className="px-6 py-4 text-left text-emerald-400 font-semibold">개선</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric, index) => (
            <tr key={index} className="border-b border-slate-800/50">
              <td className="px-6 py-4 text-white font-medium">{metric.metric}</td>
              <td className="px-6 py-4 text-slate-400">{metric.before}</td>
              <td className="px-6 py-4 text-white font-medium">{metric.after}</td>
              <td className="px-6 py-4 text-emerald-400 font-bold">{metric.improvement}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
