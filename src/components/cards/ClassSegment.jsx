import { segmentFlex } from '../../lib/derive'

// One proportional slice of the class-distribution bar.
export default function ClassSegment({ name, pct, color }) {
  return <div title={`${name} ${pct}%`} style={{ flex: segmentFlex(pct), background: color }} />
}
