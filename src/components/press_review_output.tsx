import { useState, useEffect } from "react";

interface Instruction {
  name: string;
  value: any;
}

interface OutputItem {
  type: string;
  text?: string;
  instructions?: Instruction[];
  reasoning?: string;
  output?: string;
}

const PressReviewOutput: React.FC = () => {
  const [data, setData] = useState<OutputItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/press_review");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getTypeColor = (type: string): string => {
    switch (type) {
      case "reasoning":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "text":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "tool-call":
        return "bg-green-100 text-green-800 border-green-200";
      case "tool-result":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "tool-error":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg text-gray-600">Loading press review...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Press Review Output</h1>
          <p className="mt-2 text-gray-600">Analysis results from the Lead Agent</p>
        </div>

        {data.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">No data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((item, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(item.type)}`}
                    >
                      {item.type}
                    </span>
                    <span className="text-sm text-gray-500">Step {index + 1}</span>
                  </div>

                  {item.text && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Content</h3>
                      <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">{item.text}</p>
                    </div>
                  )}

                  {item.instructions && item.instructions.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Instructions</h3>
                      <div className="bg-green-50 p-3 rounded-md">
                        {item.instructions.map((instruction, idx) => (
                          <div key={idx} className="mb-2 last:mb-0">
                            <span className="font-medium text-green-800">{instruction.name}:</span>
                            <span className="ml-2 text-green-700">
                              {typeof instruction.value === "object"
                                ? JSON.stringify(instruction.value, null, 2)
                                : instruction.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.reasoning && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Reasoning</h3>
                      <p className="text-gray-900 whitespace-pre-wrap bg-purple-50 p-3 rounded-md">{item.reasoning}</p>
                    </div>
                  )}

                  {item.output && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Output</h3>
                      <div className="bg-blue-50 p-3 rounded-md">
                        <pre className="text-sm text-blue-900 whitespace-pre-wrap">{item.output}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PressReviewOutput;
