'use client';

import React from 'react';
import { Card } from '@/components/ui/card';

interface MainLayoutProps {
  children?: React.ReactNode;
  pdfViewer?: React.ReactNode;
  analysisPanel?: React.ReactNode;
  className?: string;
}

export function MainLayout({ 
  children, 
  pdfViewer, 
  analysisPanel, 
  className = '' 
}: MainLayoutProps) {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-full px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">Typo</h1>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                Typography Analysis
              </span>
            </div>
            <div className="text-sm text-gray-600">
              4-Font-Size Rule Compliance
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children ? (
          // Single panel mode (for upload/landing page)
          <div className="max-w-4xl mx-auto px-4 py-8">
            {children}
          </div>
        ) : (
          // Two-panel mode (for analysis view)
          <div className="h-[calc(100vh-73px)] flex flex-col lg:flex-row">
            {/* Left Panel - PDF Viewer */}
            <div className="flex-1 lg:w-1/2 bg-white border-r border-gray-200">
              <div className="h-full flex flex-col">
                <div className="flex-shrink-0 px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    PDF Document
                  </h2>
                </div>
                <div className="flex-1 overflow-hidden">
                  {pdfViewer ? (
                    pdfViewer
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <div className="text-4xl mb-4">📄</div>
                        <p>No PDF loaded</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Analysis Results */}
            <div className="flex-1 lg:w-1/2 bg-gray-50">
              <div className="h-full flex flex-col">
                <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Typography Analysis
                  </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {analysisPanel ? (
                    analysisPanel
                  ) : (
                    <Card className="h-full flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <div className="text-4xl mb-4">🔍</div>
                        <p className="text-lg font-medium mb-2">
                          No Analysis Available
                        </p>
                        <p className="text-sm">
                          Upload a PDF to see typography analysis
                        </p>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Typography compliance powered by AI
          </div>
          <div className="flex items-center space-x-4">
            <span>Max 4 font sizes</span>
            <span>•</span>
            <span>10MB file limit</span>
          </div>
        </div>
      </footer>
    </div>
  );
} 