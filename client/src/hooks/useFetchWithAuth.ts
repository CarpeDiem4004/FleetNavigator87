import { useEffect, useState } from 'react'

type Options = RequestInit & {
  skip?: boolean
}

type State<T> = {
  data: T | null
  error: Error | null
  loading: boolean
}

export function useFetchWithAuth<T = unknown>(
  url: string,
  token: string,
  options: Options = {}
): State<T> {
  const [state, setState] = useState<State<T>>({
    data: null,
    error: null,
    loading: !options.skip,
  })

  useEffect(() => {
    if (options.skip) return

    let cancel = false

    async function fetchData() {
      setState({ data: null, error: null, loading: true })

      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`)
        }

        const data = (await response.json()) as T
        if (!cancel) {
          setState({ data, error: null, loading: false })
        }
      } catch (err) {
        if (!cancel) {
          setState({
            data: null,
            error: err instanceof Error ? err : new Error('Unknown error'),
            loading: false,
          })
        }
      }
    }

    fetchData()

    return () => {
      cancel = true
    }
  }, [url, token, JSON.stringify(options)]) // dependências seguras

  return state
}

export default useFetchWithAuth;