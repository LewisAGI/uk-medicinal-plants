import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { CHROME } from '../chrome'
import { Icon } from '../icons'
import { IconControl } from '../iconControl'
import { plantById, poisoningGuidance, type PublicPlant } from '../model'
import { Sheet } from '../sheet'
import { SourceList } from '../sources'
import { useTitle } from '../useTitle'

export function PlantPage() {
  const { id } = useParams()
  const plant = id ? plantById(id) : null
  useTitle(plant?.commonName ?? CHROME.appTitle)
  if (!plant) return <p className="empty page">{CHROME.empty}</p>
  return <PlantView plant={plant} />
}

function PlantView({ plant }: { plant: PublicPlant }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [gradeIndex, setGradeIndex] = useState<number | null>(null)
  const poison = poisoningGuidance()
  const openUse = gradeIndex != null ? plant.uses[gradeIndex] : null

  return (
    <article className="page plant">
      <div className="plant-head">
        <IconControl
          label={CHROME.back}
          icon="back"
          onClick={() => {
            if ((location.state as { back?: boolean } | null)?.back) navigate(-1)
            else navigate('/')
          }}
        />
        <div>
          <h1>{plant.commonName}</h1>
          <p className="latin">{plant.botanicalName}</p>
        </div>
      </div>
      <p className="consult" role="note">
        {plant.safetyBanner}
      </p>
      {plant.pendingNotice ? <p className="no-match">{plant.pendingNotice}</p> : null}
      {plant.toxicity ? (
        <section className={plant.toxicity.urgent ? 'warn warn-strong' : 'warn'}>
          <h2>
            <Icon name="warning" />
            {CHROME.toxicity}
            <span className="warn-level">{plant.toxicity.level}</span>
          </h2>
          <p className="prose">{plant.toxicity.summary}</p>
          {plant.toxicity.urgent && poison ? <p className="prose">{poison}</p> : null}
          <SourceList ids={plant.toxicity.sources} />
        </section>
      ) : null}
      {plant.lookalikes.length > 0 ? (
        <section className="warn warn-strong">
          <h2>
            <Icon name="warning" />
            {CHROME.lookalikes}
          </h2>
          {plant.lookalikes.map((item) => (
            <div className="look" key={item.lookalike}>
              <h3>{item.lookalike}</h3>
              <p className="risk">{item.risk}</p>
              <p className="prose">{item.features}</p>
              {item.evidenceLabel ? <p className="mark">{item.evidenceLabel}</p> : null}
              <SourceList ids={item.sources} />
            </div>
          ))}
        </section>
      ) : null}
      {plant.cautions.length > 0 ? (
        <section className="warn">
          <h2>{CHROME.cautions}</h2>
          {plant.cautions.map((item) => (
            <div className="caution" key={item.text}>
              <p className="prose">{item.text}</p>
              {item.evidenceLabel ? <p className="mark">{item.evidenceLabel}</p> : null}
              <SourceList ids={item.sources} />
            </div>
          ))}
        </section>
      ) : null}
      {plant.uses.map((use, index) => (
        <section className="use" data-grade={use.grade} key={`${use.grade}-${use.use}`}>
          <h2>{use.use}</h2>
          <p className="grade-line">
            <span className="grade-name">{use.gradeLabel}</span>
            <IconControl label={CHROME.gradeDefinition} icon="info" onClick={() => setGradeIndex(index)} />
          </p>
          <p className="prose explanation">{use.basis}</p>
          {use.evidenceLabel ? <p className="mark">{use.evidenceLabel}</p> : null}
          <SourceList ids={use.sources} />
        </section>
      ))}
      {plant.traditionalNotes.length > 0 ? (
        <section className="notes">
          <h2>{CHROME.traditionalNotes}</h2>
          {plant.traditionalNotes.map((item) => (
            <div key={item.text}>
              <p className="prose">{item.text}</p>
              {item.evidenceLabel ? <p className="mark">{item.evidenceLabel}</p> : null}
              <SourceList ids={item.sources} />
            </div>
          ))}
        </section>
      ) : null}
      {plant.sourceIds.length > 0 ? (
        <section className="bibliography">
          <h2>{CHROME.sources}</h2>
          <SourceList ids={plant.sourceIds} labelled={false} />
        </section>
      ) : null}
      {openUse ? (
        <Sheet label={CHROME.gradeDefinition} onClose={() => setGradeIndex(null)}>
          <p className="grade-id">{openUse.grade}</p>
          <p className="prose">{openUse.definition}</p>
        </Sheet>
      ) : null}
    </article>
  )
}
