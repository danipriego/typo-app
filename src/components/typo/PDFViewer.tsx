'use client';

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Play, 
  Upload,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { FileUpload } from '@/types/typography';

interface PDFViewerProps {
  file: FileUpload;
  onAnalysisStart: (forceRefresh?: boolean) => void;
  onReset: () => void;
  isAnalyzing: boolean;
}

export function PDFViewer({ 
  file, 
  onAnalysisStart, 
  onReset,
  isAnalyzing 
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Detect if file is PDF or PNG
  const isPDF = file.mimeType === 'application/pdf';
  const isPNG = file.mimeType === 'image/png';

  // Configure PDF.js worker (expert approach for Next.js)
  useEffect(() => {
    // Set worker src only on client side to avoid SSR issues
    if (typeof window !== 'undefined') {
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    }
  }, []);

  // Use direct Vercel Blob URL instead of redirect to avoid loading issues
  const fileUrl = file.filepath; // This is the direct Vercel Blob URL

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setError('Failed to load PDF. Please try uploading again.');
    setIsLoading(false);
  };

  const onImageLoad = () => {
    console.log('✅ Image loaded successfully:', fileUrl);
    setIsLoading(false);
    setError(null);
    setNumPages(1); // Images have only 1 "page"
  };

  const onImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('❌ Image load error:', e.type, 'URL:', fileUrl);
    setError(`Failed to load image from: ${fileUrl}`);
    setIsLoading(false);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleAnalyze = () => {
    onAnalysisStart(false);
  };

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* File Controls */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* File Info */}
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
              {file.originalName}
            </span>
            <span className="text-xs text-gray-500">
              {(file.fileSize / 1024 / 1024).toFixed(1)}MB • {isPDF ? 'PDF' : 'PNG'}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            {/* Page Navigation - Only for PDFs */}
            {isPDF && numPages > 0 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage <= 1}
                >
                  ←
                </Button>
                <span className="text-sm text-gray-600">
                  {currentPage} / {numPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, numPages))}
                  disabled={currentPage >= numPages}
                >
                  →
                </Button>
              </div>
            )}

            {/* Zoom Controls */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 min-w-[4rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={scale >= 3.0}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>

            {/* Rotate */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRotate}
            >
              <RotateCw className="h-4 w-4" />
            </Button>

            {/* Action Buttons */}
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Analyze Font Sizes
                </>
              )}
            </Button>

            {/* Add Force Refresh Button */}
            <Button
              onClick={() => onAnalysisStart(true)}
              disabled={isAnalyzing || isLoading}
              variant="outline"
              className="text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RotateCw className="h-4 w-4 mr-2" />
                  Force New Analysis
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={onReset}
              disabled={isAnalyzing}
            >
              <Upload className="h-4 w-4 mr-2" />
              New File
            </Button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert className="m-4" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* File Display */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex justify-center">
          {isPDF ? (
            /* PDF Viewer */
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <Card className="w-full max-w-2xl h-96 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Loading PDF...</p>
                  </div>
                </Card>
              }
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                rotate={rotation}
                loading={
                  <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                }
              />
            </Document>
          ) : isPNG ? (
            /* PNG Image Viewer */
            <div 
              className="border border-gray-300 bg-white shadow-lg"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: 'center',
                transition: 'transform 0.2s ease'
              }}
            >
              {isLoading && (
                <Card className="w-full max-w-2xl h-96 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Loading image...</p>
                  </div>
                </Card>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fileUrl}
                alt={file.originalName}
                onLoad={onImageLoad}
                onError={onImageError}
                className={`max-w-full h-auto ${isLoading ? 'hidden' : 'block'}`}
                style={{ maxHeight: '80vh' }}
              />
            </div>
          ) : (
            /* Unsupported file type */
            <Card className="w-full max-w-2xl h-96 flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
                <p className="text-gray-600">Unsupported file type</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <div className="flex-shrink-0 bg-blue-50 border-t border-blue-200 p-4">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Analyzing font sizes and type scale compliance...
              </p>
              <p className="text-xs text-blue-600">
                Detecting and counting distinct font sizes
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 