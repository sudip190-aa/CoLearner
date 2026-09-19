import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Colearn render error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-c-blue-wash px-6 py-12">
          <div className="w-full max-w-md rounded-brand-lg border border-c-border bg-c-surface p-7 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-c-danger-soft text-xl text-c-danger">
              !
            </div>
            <h1 className="text-2xl font-bold text-c-text">
              Something went wrong
            </h1>
            <p className="mt-3 text-sm leading-6 text-c-text-muted">
              Colearn hit an unexpected issue. Try reloading the page or going
              back to the dashboard.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-brand bg-c-action px-4 py-2 text-sm font-semibold text-white hover:bg-c-action-hover"
              >
                Reload
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="rounded-brand border border-c-border bg-c-surface px-4 py-2 text-sm font-semibold text-c-text hover:bg-c-blue-wash"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
