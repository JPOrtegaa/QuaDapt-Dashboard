import { useState } from 'react'
import DatasetSelector from './DatasetSelector'
import ResultsKPIRow from './results/ResultsKPIRow'
import MethodRankingCard from './results/MethodRankingCard'
import FamilyCompareCard from './results/FamilyCompareCard'
import PrevalenceShiftCard from './results/PrevalenceShiftCard'
import ClassHeatmapCard from './results/ClassHeatmapCard'
import ScoreDistributionsCard from './results/scores/ScoreDistributionsCard'
import GeneralView from './results/general/GeneralView'
import ExperimentSelector from './results/ExperimentSelector'
import ToplineToggle from './results/ToplineToggle'
import VariantBoxCard from './results/variants/VariantBoxCard'
import DriftDetectorCard from './results/detectors/DriftDetectorCard'
import { PaletteProvider } from './results/PaletteContext'
import { VARIANT_PALETTES } from '../lib/resultsDerive'
import {
  useExperiments, useResultsManifest, useResultDataset, useGeneral,
  useDatasetAcrossRuns, useGeneralAcrossRuns,
} from '../data/useResults'
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
  const { status: eStatus, experiments, error: eError } = useExperiments()
  // Which run feeds the tab; null until experiments.json lands, then the first
  // entry (newest run) unless the user picks another.
  const [experimentId, setExperimentId] = useState(null)
  const activeExperimentId = experimentId ?? experiments[0]?.id ?? null

  const { status: mStatus, datasets: manifest, error: mError } = useResultsManifest(activeExperimentId)
  const [selectedId, setSelectedId] = useState(GENERAL_ID)
  // Method/family names are shared vocabulary across every dataset (same 32
  // qnt algorithms everywhere), so keeping the selection by name across a
  // dataset switch is desired, not stale state — no reset effect needed.
  const [selectedFamilyBase, setSelectedFamilyBase] = useState(null)
  const [selectedMethod, setSelectedMethod] = useState(null)

  // Runs don't share a dataset list, so a selection that the newly picked run
  // has no results for falls back to the cross-dataset overview.
  const knownId = selectedId === GENERAL_ID || manifest.some((d) => d.id === selectedId)
  const activeId = knownId ? selectedId : GENERAL_ID

  const isGeneral = activeId === GENERAL_ID
  const { status: gStatus, general, error: gError } = useGeneral(activeExperimentId, isGeneral)
  const { status: dStatus, dataset, error: dError } = useResultDataset(
    activeExperimentId,
    isGeneral ? null : activeId,
  )

  // Cross-run compare, shared by the per-dataset ranking card and the General
  // aggregate card so the toggle reads the same in both places. Only the
  // relevant one fetches — the other stays idle.
  const [compareMode, setCompareMode] = useState('single')
  const experimentIds = experiments.map((e) => e.id)
  const comparing = compareMode === 'compare'
  const datasetRuns = useDatasetAcrossRuns(experimentIds, isGeneral ? null : activeId, comparing)
  const generalRuns = useGeneralAcrossRuns(experimentIds, comparing && isGeneral)

  // Whether the <base>_topline oracles take part: tab-level for the same
  // reason as compareMode — the per-dataset charts and the General method
  // charts must agree. Runs without toplines are unaffected (toggle hidden).
  const [showTopline, setShowTopline] = useState(true)

  if (eStatus === 'error') return <div className="state err">Failed to load data/results/experiments.json — {eError}</div>
  if (eStatus === 'loading' || mStatus === 'loading') return <div className="state">Loading results…</div>
  if (mStatus === 'error') return <div className="state err">Failed to load data/results/{activeExperimentId}/manifest.json — {mError}</div>
  if (manifest.length === 0) return <div className="state">No results found.</div>

  const selectorDatasets = [GENERAL_ENTRY, ...manifest]
  const manifestEntry = manifest.find((d) => d.id === activeId)
  const hasTopline = manifest.some((d) => d.nTopline > 0)
  // Detector-gated runs switch every chart to the classic / cdt / ibdd / syn / gamma palette.
  const activeExperiment = experiments.find((e) => e.id === activeExperimentId)
  const familyPalette = Boolean(activeExperiment?.detectors?.length)
  const hasGamma = Boolean(activeExperiment?.variants?.includes('gamma'))
  const palette = familyPalette ? VARIANT_PALETTES.family : VARIANT_PALETTES.default
  const toplineOn = hasTopline && showTopline
  const methodsMeta = manifestEntry
    ? `${manifestEntry.nMethods} methods${toplineOn && manifestEntry.nTopline ? ` (+${manifestEntry.nTopline} topline)` : ''}`
    : '— methods'

  return (
    <PaletteProvider value={palette}>
      <div className="head">
        <div className="head-l">
          <h1>Quantification results</h1>
          <DatasetSelector datasets={selectorDatasets} selectedId={activeId} onSelect={setSelectedId} />
        </div>
        <div className="head-r">
          <ExperimentSelector
            experiments={experiments}
            selectedId={activeExperimentId}
            onSelect={setExperimentId}
          />
          <ToplineToggle value={showTopline} onChange={setShowTopline} hasTopline={hasTopline} />
          <span className="meta">
            {isGeneral
              ? `${general?.nDatasets ?? manifest.length} datasets · cross-dataset overview`
              : `${methodsMeta} · ${fmtSamples(manifestEntry?.nBatches)} samples · AE on normalized preds`}
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
        ) : familyPalette ? (
          <>
            Absolute error per test sample, computed from the <span className="mono">*_p_normalized</span> columns
            against true prevalence. Method families:{' '}
            <span className="fam" style={{ color: palette.classic }}>classic</span>,{' '}
            <span className="fam" style={{ color: palette.cdt }}>QuaDapt_cdt</span> and{' '}
            <span className="fam" style={{ color: palette.ibdd }}>QuaDapt_ibdd</span> (drift-gated: synthetic scores
            on drift, training scores otherwise),{' '}
            <span className="fam" style={{ color: palette.syn }}>QuaDapt (_syn)</span>
            {hasGamma && (
              <>
                ,{' '}
                <span className="fam" style={{ color: palette.gamma }}>QuaDapt_gamma</span> (training scores
                reshaped by a per-batch gamma)
              </>
            )}
            {toplineOn && (
              <>, <span className="sage">sage = _topline</span> (per class, the better of base / _syn — an oracle upper bound)</>
            )}.
          </>
        ) : (
          <>
            Absolute error per test sample, computed from the <span className="mono">*_p_normalized</span> columns
            against true prevalence. <span className="mint">Mint = our adapted methods (_syn)</span>, grey = classic baselines
            {toplineOn && (
              <>, <span className="sage">sage = _topline</span> (per class, the better of base / _syn — an oracle upper bound)</>
            )}.
          </>
        )}
      </div>

      {isGeneral && gStatus !== 'ready' && (
        gStatus === 'error'
          ? <div className="state err">Failed to load results/{activeExperimentId}/general.json — {gError}</div>
          : <div className="state">Loading cross-dataset overview…</div>
      )}

      {isGeneral && gStatus === 'ready' && general && (
        <GeneralView
          general={general}
          onPickDataset={setSelectedId}
          compare={{
            mode: compareMode,
            onModeChange: setCompareMode,
            experiments,
            referenceId: activeExperimentId,
            byRun: generalRuns.byRun,
            compareStatus: generalRuns.status,
          }}
          showTopline={toplineOn}
        />
      )}

      {!isGeneral && manifestEntry && <ResultsKPIRow manifest={manifestEntry} />}

      {!isGeneral && dStatus === 'loading' && <div className="state">Loading {manifestEntry?.name}…</div>}
      {!isGeneral && dStatus === 'error' && <div className="state err">Failed to load results/{activeExperimentId}/{activeId}.json — {dError}</div>}

      {!isGeneral && dStatus === 'ready' && dataset && (() => {
        // Single choke point for the topline toggle: every per-dataset card
        // reads this list, so a hidden topline can't be the selected method.
        const methods = toplineOn ? dataset.methods : dataset.methods.filter((m) => !m.isTopline)
        const activeMethod =
          methods.find((m) => m.name === selectedMethod)?.name ?? methods[0]?.name ?? null
        const activeFamily =
          dataset.families.find((f) => f.base === selectedFamilyBase) ?? dataset.families[0] ?? null

        return (
          <div className="grid" style={{ marginTop: 18 }}>
            <MethodRankingCard
              methods={methods}
              selectedMethod={activeMethod}
              onSelectMethod={setSelectedMethod}
              showTopline={toplineOn}
              mode={compareMode}
              onModeChange={setCompareMode}
              experiments={experiments}
              referenceId={activeExperimentId}
              byRun={datasetRuns.byRun}
              missingRuns={datasetRuns.missingRuns}
              compareStatus={datasetRuns.status}
            />

            {dataset.variantBoxes && (
              <VariantBoxCard boxes={dataset.variantBoxes} classes={dataset.classes} nBatches={dataset.nBatches} />
            )}

            <FamilyCompareCard
              families={dataset.families}
              selectedFamily={activeFamily}
              onSelectFamily={(f) => setSelectedFamilyBase(f.base)}
            />

            {activeFamily && <PrevalenceShiftCard tv={dataset.tv} family={activeFamily} />}

            <ClassHeatmapCard
              dataset={{ ...dataset, methods }}
              selectedMethod={activeMethod}
              onSelectMethod={setSelectedMethod}
            />

            {dataset.detectors && (
              <DriftDetectorCard detectors={dataset.detectors} classes={dataset.classes} tv={dataset.tv} />
            )}

            {manifestEntry.scores && (
              <ScoreDistributionsCard
                experimentId={activeExperimentId}
                datasetId={activeId}
                scores={manifestEntry.scores}
                detectors={dataset.detectors ?? null}
              />
            )}
          </div>
        )
      })()}
    </PaletteProvider>
  )
}
