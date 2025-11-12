'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class HistoryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('HistoryContext crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <div className="max-w-md mx-auto">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              History Temporarily Unavailable
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Something went wrong while loading your history. This is usually temporary.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-[#ff6b35] text-white rounded-lg hover:bg-[#ff8555] transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
