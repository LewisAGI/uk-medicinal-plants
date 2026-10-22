import { useSearchParams } from 'react-router-dom'

export function toggleValue(params: URLSearchParams, key: string, value: string) {
  const values = params.getAll(key)
  params.delete(key)
  const next = values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
  for (const item of next) params.append(key, item)
}

export function useSearchState() {
  const [params, setParams] = useSearchParams()

  function update(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(params)
    mutate(next)
    setParams(next, { replace: true })
  }

  return {
    q: params.get('q') ?? '',
    habitats: params.getAll('habitat'),
    seasons: params.getAll('season'),
    grades: params.getAll('grade'),
    sort: params.get('sort') === 'latin' ? ('latin' as const) : ('common' as const),
    publishers: params.getAll('publisher'),
    update,
  }
}
