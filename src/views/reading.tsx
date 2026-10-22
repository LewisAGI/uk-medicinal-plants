import { useState } from 'react'
import { CHROME } from '../chrome'
import { Icon } from '../icons'
import { IconControl } from '../iconControl'
import { groupSources, labelize, publisherNames, readingList } from '../model'
import { Sheet } from '../sheet'
import { useSearchState, toggleValue } from '../useQuery'
import { useTitle } from '../useTitle'

export function Reading() {
  useTitle(CHROME.reading)
  const state = useSearchState()
  const [open, setOpen] = useState(false)
  const groups = groupSources(readingList(state.q, state.publishers))
  const names = publisherNames()

  return (
    <div className="page">
      <h1>{CHROME.reading}</h1>
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
            onClick={() => state.update((next) => next.delete('q'))}
          />
        ) : null}
        <IconControl
          label={CHROME.publishers}
          icon="sliders"
          pressed={state.publishers.length > 0}
          expanded={open}
          haspopup="dialog"
          onClick={() => setOpen(true)}
        />
      </div>
      {groups.length > 0 ? (
        groups.map((group) => (
          <section className="publisher" key={group.publisher}>
            <h2>{group.publisher}</h2>
            <ul className="reading-list">
              {group.sources.map((source) => (
                <li key={source.id}>
                  <a href={source.url} target="_blank" rel="noreferrer noopener">
                    {source.title}
                  </a>
                  <span className="source-meta">{labelize(source.type)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))
      ) : (
        <p className="empty">{CHROME.empty}</p>
      )}
      {open ? (
        <Sheet label={CHROME.publishers} onClose={() => setOpen(false)}>
          {names.map((name) => (
            <label className="choice" key={name}>
              <input
                type="checkbox"
                checked={state.publishers.includes(name)}
                onChange={() => state.update((next) => toggleValue(next, 'publisher', name))}
              />
              <span>{name}</span>
            </label>
          ))}
          {state.publishers.length > 0 ? (
            <div className="sheet-actions">
              <IconControl
                label={CHROME.clearFilters}
                icon="close"
                onClick={() => state.update((next) => next.delete('publisher'))}
              />
            </div>
          ) : null}
        </Sheet>
      ) : null}
    </div>
  )
}
