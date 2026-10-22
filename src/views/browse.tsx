import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CHROME } from '../chrome'
import { EXAMPLE_DATA_LABEL, HABITATS, SEASONS } from '../exampleFacets'
import { Icon } from '../icons'
import { IconControl } from '../iconControl'
import { GRADE_LABEL, GRADE_ORDER, catalog, type CatalogItem, type PublicPlant } from '../model'
import { Sheet } from '../sheet'
import { useSearchState, toggleValue } from '../useQuery'
import { useTitle } from '../useTitle'

function highlight(text: string, query: string): ReactNode {
  const needle = query.trim()
  if (needle.length < 2) return text
  const index = text.toLowerCase().indexOf(needle.toLowerCase())
  if (index < 0) return text
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + needle.length)}</mark>
      {text.slice(index + needle.length)}
    </>
  )
}

function Card({ item, query }: { item: CatalogItem; query: string }) {
  const plant = item.plant
  const grades = [...new Set(plant.uses.map((use) => use.gradeLabel))]
  return (
    <li>
      <Link className="card" to={`/plants/${plant.id}`} state={{ back: true }} data-plant-id={plant.id}>
        <span className="card-name">{highlight(plant.commonName, query)}</span>
        <span className="card-latin">{highlight(plant.botanicalName, query)}</span>
        {item.kind === 'non-medicinal' ? (
          <p className="no-match-inline">{CHROME.noMatch}</p>
        ) : (
          <>
            {grades.length > 0 ? <p className="card-grade">{grades.join(' · ')}</p> : null}
            {plant.uses[0] ? <p className="card-basis">{plant.uses[0].basis}</p> : null}
          </>
        )}
        <Warnings plant={plant} />
      </Link>
    </li>
  )
}

function Warnings({ plant }: { plant: PublicPlant }) {
  return (
    <>
      {plant.toxicity ? (
        <p className="card-warn">
          {CHROME.toxicity}: {plant.toxicity.level}
        </p>
      ) : null}
      {plant.lookalikes.length > 0 ? (
        <p className="card-warn">
          {CHROME.lookalikePrefix}: {plant.lookalikes.map((item) => item.lookalike).join('; ')}
        </p>
      ) : null}
    </>
  )
}

export function Browse() {
  useTitle(CHROME.appTitle)
  const state = useSearchState()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const items = catalog({
    q: state.q,
    habitats: state.habitats,
    seasons: state.seasons,
    grades: state.grades,
    sort: state.sort,
  })
  const filtersOn = state.habitats.length + state.seasons.length + state.grades.length > 0

  return (
    <div className="page">
      <div className="searchrow">
        <label className="search">
          <Icon name="search" />
          <input
            type="search"
            role="searchbox"
            aria-label={CHROME.search}
            value={state.q}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            onChange={(event) => {
              const value = event.target.value
              state.update((next) => {
                if (value) next.set('q', value)
                else next.delete('q')
              })
            }}
          />
        </label>
        {state.q ? (
          <IconControl
            label={CHROME.clearSearch}
            icon="close"
            onClick={() => {
              state.update((next) => next.delete('q'))
            }}
          />
        ) : null}
        <IconControl
          label={CHROME.sort}
          icon="sort"
          pressed={state.sort === 'latin'}
          expanded={sortOpen}
          haspopup="dialog"
          onClick={() => setSortOpen(true)}
        />
        <IconControl
          label={CHROME.filters}
          icon="sliders"
          pressed={filtersOn}
          expanded={filtersOpen}
          haspopup="dialog"
          onClick={() => setFiltersOpen(true)}
        />
      </div>
      {items.length > 0 ? (
        <ul className="catalog">
          {items.map((item) => (
            <Card key={item.plant.id} item={item} query={state.q} />
          ))}
        </ul>
      ) : (
        <p className="empty">{CHROME.empty}</p>
      )}
      {filtersOpen ? (
        <Sheet label={CHROME.filters} onClose={() => setFiltersOpen(false)}>
          <fieldset>
            <legend>{CHROME.evidenceGrade}</legend>
            {GRADE_ORDER.map((grade) => (
              <label className="choice" key={grade}>
                <input
                  type="checkbox"
                  checked={state.grades.includes(grade)}
                  onChange={() => state.update((next) => toggleValue(next, 'grade', grade))}
                />
                <span>{GRADE_LABEL[grade]}</span>
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>
              {CHROME.habitat}
              <span className="example-tag">{EXAMPLE_DATA_LABEL}</span>
            </legend>
            {HABITATS.map((habitat) => (
              <label className="choice" key={habitat.id}>
                <input
                  type="checkbox"
                  checked={state.habitats.includes(habitat.id)}
                  onChange={() => state.update((next) => toggleValue(next, 'habitat', habitat.id))}
                />
                <span>{habitat.label}</span>
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>
              {CHROME.season}
              <span className="example-tag">{EXAMPLE_DATA_LABEL}</span>
            </legend>
            {SEASONS.map((season) => (
              <label className="choice" key={season.id}>
                <input
                  type="checkbox"
                  checked={state.seasons.includes(season.id)}
                  onChange={() => state.update((next) => toggleValue(next, 'season', season.id))}
                />
                <span>{season.label}</span>
              </label>
            ))}
          </fieldset>
          {filtersOn ? (
            <div className="sheet-actions">
              <IconControl
                label={CHROME.clearFilters}
                icon="close"
                onClick={() => {
                  state.update((next) => {
                    next.delete('habitat')
                    next.delete('season')
                    next.delete('grade')
                  })
                }}
              />
            </div>
          ) : null}
        </Sheet>
      ) : null}
      {sortOpen ? (
        <Sheet label={CHROME.sort} onClose={() => setSortOpen(false)}>
          <div className="choices" role="radiogroup" aria-label={CHROME.sort}>
            <label className="choice">
              <input
                type="radio"
                name="sort"
                checked={state.sort === 'common'}
                onChange={() => state.update((next) => next.delete('sort'))}
              />
              <span>{CHROME.commonName}</span>
            </label>
            <label className="choice">
              <input
                type="radio"
                name="sort"
                checked={state.sort === 'latin'}
                onChange={() => state.update((next) => next.set('sort', 'latin'))}
              />
              <span>{CHROME.latinName}</span>
            </label>
          </div>
        </Sheet>
      ) : null}
    </div>
  )
}
