import { useEffect, useState } from 'react'
import DatasetSelector from './DatasetSelector'
import ResultsKPIRow from './results/ResultsKPIRow'
import MethodRankingCard from './results/MethodRankingCard'
import FamilyCompareCard from './results/FamilyCompareCard'
import PrevalenceShiftCard from './results/PrevalenceShiftCard'
import ClassHeatmapCard from './results/ClassHeatmapCard'
import GeneralView from './results/general/GeneralView'
import { useResultsManifest, useResultDataset, useGeneral } from '../data/useResults'
import { fmtSamples } from '../lib/resultsFormat'

const GENERAL_ID = '__general__'

// Synthetic dropdown entry that opens the cross-dataset overview. Pinned to the
// top by living in its own source group ('_general', first in the manifest).
const GENERAL_ENTRY = {
  id: GENERAL_ID,
  name: 'General',
  source: '_general',
  desc: 'cross-dataset overview',
}

export default function ResultsTab() {
  const { status: mStatus, datasets: manifest, error: mError } = useResultsManifest()
  const [selectedId, setSelectedId] = useState(GENERAL_ID)
  // Method/family names are shared vocabulary across every dataset (same 32
  // qnt algorithms everywhere), so keeping the selection by name across a
  // dataset switch is desired, not stale state — no reset effect needed.
  const [selectedFamilyBase, setSelectedFamilyBase] = useState(null)
  const [selectedMethod, setSelectedMethod] = useState(null)

  const isGeneral = selectedId === GENERAL_ID
  const { status: gStatus, general, error: gError } = useGeneral(isGeneral)
  const { status: dStatus, dataset, error: dError } = useResultDataset(isGeneral ? null : selectedId)

  if (mStatus === 'loading') return <div className="state">Loading results…</div>
  if (mStatus === 'error') return <div className="state err">Failed to load data/results/manifest.json — {mError}</div>
  if (manifest.length === 0) return <div className="state">No results found.</div>

  const selectorDatasets = [GENERAL_ENTRY, ...manifest]
  const manifestEntry = manifest.find((d) => d.id === selectedId)

  return (
    <>
      <div className="head">
        <div className="head-l">
          <h1>Quantification results</h1>
          <DatasetSelector datasets={selectorDatasets} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <div className="head-r">
          <span className="meta">
            {isGeneral
              ? `${general?.nDatasets ?? manifest.length} datasets · cross-dataset overview`
              : `${manifestEntry?.nMethods ?? '—'} methods · ${fmtSamples(manifestEntry?.nBatches)} samples · AE on normalized preds`}
          </span>
        </div>
      </div>

      <div className="results-desc">
        {isGeneral ? (
          <>
            Aggregate view over all datasets: which dataset characteristics make QuaDapt&apos;s
            adaptation pay off. <span className="mint">Mint = _syn improves (Δ AE &lt; 0)</span>,
            amber = regresses. Δ AE is <span className="mono">syn − base</span> mean absolute error.
          </>
        ) : (
          <>
            Absolute error per test sample, computed from the <span className="mono">*_p_normalized</span> columns
            against true prevalence. <span className="mint">Mint = our adapted methods (_syn)</span>, grey = classic baselines.
          </>
        )}
      </div>

      {isGeneral && gStatus !== 'ready' && (
        gStatus === 'error'
          ? <div className="state err">Failed to load results/general.json — {gError}</div>
          : <div className="state">Loading cross-dataset overview…</div>
      )}

      {isGeneral && gStatus === 'ready' && general && (
        <GeneralView general={general} onPickDataset={setSelectedId} />
      )}

      {!isGeneral && manifestEntry && <ResultsKPIRow manifest={manifestEntry} />}

      {!isGeneral && dStatus === 'loading' && <div className="state">Loading {manifestEntry?.name}…</div>}
      {!isGeneral && dStatus === 'error' && <div className="state err">Failed to load results/{selectedId}.json — {dError}</div>}

      {!isGeneral && dStatus === 'ready' && dataset && (() => {
        const activeMethod =
          dataset.methods.find((m) => m.name === selectedMethod)?.name ?? dataset.methods[0]?.name ?? null
        const activeFamily =
          dataset.families.find((f) => f.base === selectedFamilyBase) ?? dataset.families[0] ?? null

        return (
          <div className="grid" style={{ marginTop: 18 }}>
            <MethodRankingCard
              methods={dataset.methods}
              selectedMethod={activeMethod}
              onSelectMethod={setSelectedMethod}
            />

            <FamilyCompareCard
              families={dataset.families}
              selectedFamily={activeFamily}
              onSelectFamily={(f) => setSelectedFamilyBase(f.base)}
            />

            {activeFamily && <PrevalenceShiftCard tv={dataset.tv} family={activeFamily} />}

            <ClassHeatmapCard
              dataset={dataset}
              selectedMethod={activeMethod}
              onSelectMethod={setSelectedMethod}
            />
          </div>
        )
      })()}
    </>
  )
}
