import { CHROME } from './chrome'
import { sourceById } from './model'

export function SourceList({ ids, labelled = true }: { ids: readonly string[]; labelled?: boolean }) {
  if (!ids.length) return null
  return (
    <div className="source-block">
      {labelled ? <h3 className="kicker">{CHROME.sources}</h3> : null}
      <ul className="sources">
        {ids.map((id) => {
          const source = sourceById(id)
          return (
            <li key={id}>
              <a href={source.url} target="_blank" rel="noreferrer noopener">
                {source.title}
              </a>
              <span className="source-meta">{source.publisher}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
