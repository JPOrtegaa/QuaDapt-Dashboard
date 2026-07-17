import Card from '../Card'
import { BarsIcon } from '../Icons'
import MethodRankingChart from './MethodRankingChart'

export default function MethodRankingCard({ methods, selectedMethod, onSelectMethod }) {
  return (
    <Card
      wide
      icon={<BarsIcon />}
      title="Method ranking — mean absolute error"
      subtitle="sorted best → worst · bar = mean AE · whisker = interquartile range (Q1–Q3)"
      style={{ padding: '22px 24px' }}
    >
      <MethodRankingChart methods={methods} selected={selectedMethod} onSelect={onSelectMethod} />
    </Card>
  )
}
