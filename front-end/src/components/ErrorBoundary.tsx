import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorStr: string;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorStr: ""
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorStr: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public handleRefresh = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-500 mb-6 max-w-md">
            We've encountered an unexpected error. Please try refreshing the page or navigating back.
          </p>
          <div className="bg-red-50 p-4 rounded-lg w-full max-w-md text-left text-sm text-red-800 font-mono overflow-auto mb-6">
             {this.state.errorStr}
          </div>
          <button
            onClick={this.handleRefresh}
            className="flex items-center px-6 py-3 rounded-xl font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm"
          >
            <RefreshCcw className="w-5 h-5 mr-2" />
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
