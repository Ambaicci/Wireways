"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-[#FDEBE0] flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-[#F1622C]" />
          </div>
          <h2 className="text-[18px] font-semibold text-[#18140F] mb-2">Something went wrong</h2>
          <p className="text-[13px] text-[#8C8579] text-center max-w-md mb-4">
            We hit an unexpected error. Please refresh the page or try again in a moment.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#18140F] text-white rounded-lg text-[13px] font-semibold hover:bg-black transition-colors"
          >
            Refresh page
          </button>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <details className="mt-6 max-w-2xl w-full">
              <summary className="text-[11px] text-[#8C8579] cursor-pointer">Error details (dev only)</summary>
              <pre className="mt-2 p-4 bg-[#FAFAF9] border border-[#EAE6DF] rounded-lg text-[10px] font-mono text-[#4E4841] overflow-auto max-h-[200px]">
                {this.state.error.toString()}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}