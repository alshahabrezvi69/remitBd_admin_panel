import React, { Component } from 'react';

interface AdminViewErrorBoundaryProps {
  children: React.ReactNode;
  viewName?: string;
}

interface AdminViewErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class AdminViewErrorBoundary extends (Component as any) {
  declare props: AdminViewErrorBoundaryProps;
  declare setState: (state: Partial<AdminViewErrorBoundaryState>) => void;
  state: AdminViewErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): AdminViewErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unexpected error while rendering this admin view.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Admin view render error', error, info);
  }

  private retry = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="rounded-2xl border border-rose-200 bg-white p-8 shadow-sm">
        <div className="mx-auto max-w-xl text-center">
          <div className="text-sm font-bold text-slate-900">This admin view could not be displayed</div>
          <p className="mt-2 text-xs leading-5 text-slate-600">
            {this.props.viewName || 'The selected record'} returned data the page could not render safely. The request was not silently discarded.
          </p>
          <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-left text-[11px] text-rose-700 break-words">
            {this.state.message || 'Unexpected rendering error.'}
          </div>
          <button onClick={this.retry} className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">
            Retry view
          </button>
        </div>
      </div>
    );
  }
}
