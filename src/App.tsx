import { useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { CHROME } from './chrome'
import { IconControl } from './iconControl'
import { generalSafety } from './model'
import { Sheet } from './sheet'
import { SourceList } from './sources'
import { useTitle } from './useTitle'
import { Browse } from './views/browse'
import { Glossary } from './views/glossary'
import { PlantPage } from './views/plant'
import { Reading } from './views/reading'

function Missing() {
  useTitle(CHROME.appTitle)
  return <p className="empty page">{CHROME.empty}</p>
}

function SafetySheet({ onClose }: { onClose: () => void }) {
  const items = generalSafety()
  return (
    <Sheet label={CHROME.safety} onClose={onClose}>
      {items.map((item) => (
        <article className="safety-item" key={item.id}>
          <p className="prose">{item.text}</p>
          <SourceList ids={item.sources} />
        </article>
      ))}
    </Sheet>
  )
}

export function App() {
  const [safety, setSafety] = useState(false)
  return (
    <div className="shell">
      <div className="frame">
        <div className="top">
          <p className="notice" role="note">
            {CHROME.notice}
          </p>
          <header className="topbar">
            <Link to="/" className="wordmark">
              {CHROME.appTitle}
            </Link>
            <IconControl
              label={CHROME.safety}
              icon="shield"
              pressed={safety}
              expanded={safety}
              haspopup="dialog"
              onClick={() => setSafety(true)}
            />
          </header>
        </div>
        <main id="main">
          <Routes>
            <Route path="/" element={<Browse />} />
            <Route path="/plants/:id" element={<PlantPage />} />
            <Route path="/glossary" element={<Glossary />} />
            <Route path="/reading" element={<Reading />} />
            <Route path="*" element={<Missing />} />
          </Routes>
        </main>
      </div>
      <nav aria-label={CHROME.primary}>
        <IconControl to="/" end label={CHROME.browse} icon="leaf" />
        <IconControl to="/glossary" label={CHROME.glossary} icon="book" />
        <IconControl to="/reading" label={CHROME.reading} icon="books" />
      </nav>
      {safety ? <SafetySheet onClose={() => setSafety(false)} /> : null}
    </div>
  )
}
