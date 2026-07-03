import SizeShape from './cards/SizeShape'
import FeatureComposition from './cards/FeatureComposition'
import DataQuality from './cards/DataQuality'
import Redundancy from './cards/Redundancy'
import ClassStructure from './cards/ClassStructure'
import FeatureStats from './cards/FeatureStats'

// The six descriptor cards for one view (raw or preprocessed) of a dataset.
export default function CardGrid({ view }) {
  return (
    <div className="grid">
      <SizeShape view={view} />
      <FeatureComposition view={view} />
      <DataQuality view={view} />
      <Redundancy view={view} />
      <ClassStructure view={view} />
      <FeatureStats view={view} />
    </div>
  )
}
