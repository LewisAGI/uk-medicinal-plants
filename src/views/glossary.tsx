import { CHROME } from '../chrome'
import { glossaryEntries } from '../model'
import { useTitle } from '../useTitle'

export function Glossary() {
  useTitle(CHROME.glossary)
  const entries = glossaryEntries()
  return (
    <div className="page">
      <h1>{CHROME.glossary}</h1>
      {entries.map((entry) => (
        <article className="gloss" key={entry.id}>
          <h2>{entry.term}</h2>
          <p className="grade-id">{entry.id}</p>
          <p className="prose">{entry.definition}</p>
        </article>
      ))}
    </div>
  )
}
