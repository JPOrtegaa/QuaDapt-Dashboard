import { useState } from 'react'
import GeneralKPIRow from './GeneralKPIRow'
import LeaderboardCard from './LeaderboardCard'
import MetadataScatterCard from './MetadataScatterCard'
import PredictorRankingCard from './PredictorRankingCard'
import FamilyHeatmapCard from './FamilyHeatmapCard'
import GlobalMethodRankCard from './GlobalMethodRankCard'

// The cross-dataset "General" overview: aggregate KPIs, the win leaderboard,
// the metadata scatter + predictor ranking (linked by a shared axis), the
// dataset×family heatmap, and the global method ranking. `onPickDataset`
// drills from any dataset mark back into its per-dataset results.
export default function GeneralView({ general, onPickDataset }) {
  const [axisKey, setAxisKey] = useState(
    general.summary.topPredictor?.key ?? general.metadataFields[0].key,
  )
  const field =
    general.metadataFields.find((f) => f.key === axisKey) ?? general.metadataFields[0]

  return (
    <>
      <GeneralKPIRow general={general} />

      <div className="grid" style={{ marginTop: 18 }}>
        <LeaderboardCard general={general} onPickDataset={onPickDataset} />

        <MetadataScatterCard
          general={general}
          field={field}
          onPickField={setAxisKey}
          onPickDataset={onPickDataset}
        />

        <PredictorRankingCard general={general} selectedKey={axisKey} onPickField={setAxisKey} />

        <FamilyHeatmapCard general={general} onPickDataset={onPickDataset} />

        <GlobalMethodRankCard general={general} />
      </div>
    </>
  )
}
