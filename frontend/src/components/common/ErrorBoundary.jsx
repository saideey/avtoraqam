import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Xatolik yuz berdi
            </h2>
            <p className="text-gray-600 mb-4">
              Kutilmagan xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.
            </p>
            <button
              onClick={this.handleReset}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Qaytadan urinish
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
