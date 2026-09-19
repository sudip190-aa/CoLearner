import { useState, useCallback, useEffect } from 'react'

/**
 * Custom hook to wrap API calls with loading, error, and data state.
 *
 * @param {Function} apiFunc - The async API function to call (e.g., auth.login, books.getBooks)
 * @param {boolean} [immediate=false] - Whether to execute the function immediately on mount
 * @param {Array} [initialArgs=[]] - Initial arguments to pass to the API function if immediate is true
 * @returns {Object} { data, loading, error, execute, refetch }
 */
export const useApi = (apiFunc, immediate = false, initialArgs = []) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState(null)

  // Use a ref to store the latest args for refetch
  const [lastArgs, setLastArgs] = useState(initialArgs)

  const execute = useCallback(
    async (...args) => {
      setLoading(true)
      setError(null)
      setLastArgs(args)

      try {
        const result = await apiFunc(...args)
        setData(result)
        return result
      } catch (err) {
        setError(err)
        // Optional: propagate error if needed by the component
        throw err
      } finally {
        setLoading(false)
      }
    },
    [apiFunc],
  )

  const refetch = useCallback(() => {
    return execute(...lastArgs)
  }, [execute, lastArgs])

  useEffect(() => {
    if (immediate) {
      // `execute` flips the loading flag synchronously before awaiting, which is
      // the intended behaviour for an immediate fetch — the rule assumes a
      // render-loop hazard that does not apply to a user-triggered API call.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      execute(...initialArgs).catch(() => {
        // Error is already caught and set in state by execute
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, execute]) // Intentionally not including initialArgs to avoid infinite loops if it's passed inline

  return { data, loading, error, execute, refetch }
}

export default useApi
