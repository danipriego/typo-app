'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/typo/MainLayout';
import { FileUploadZone } from '@/components/typo/FileUploadZone';
import { PDFViewer } from '@/components/typo/PDFViewer';
import { AnalysisPanel } from '@/components/typo/AnalysisPanel';
import { FileUpload, TypographyAnalysis } from '@/types/typography';

export default function HomePage() {
  const [uploadedFile, setUploadedFile] = useState<FileUpload | null>(null);
  const [analysisResult, setAnalysisResult] = useState<TypographyAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileUpload = (file: FileUpload) => {
    setUploadedFile(file);
    setAnalysisResult(null);
    setIsAnalyzing(false);
  };

  const handleAnalysisStart = async (forceRefresh = false) => {
    console.log('�� Frontend: Starting analysis for file:', uploadedFile?.id, 'forceRefresh:', forceRefresh);
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    try {
      console.log('📡 Frontend: Making API call to /api/analyze');
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: uploadedFile?.id,
          forceRefresh: forceRefresh
        }),
      });

      console.log('📡 Frontend: API response status:', response.status);
      const result = await response.json();
      console.log('📡 Frontend: API result:', result);

      if (response.ok && result.success) {
        console.log('✅ Frontend: Analysis successful, setting result');
        setAnalysisResult(result.data);
      } else {
        console.error('❌ Frontend: Analysis failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Frontend: Network/parse error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setUploadedFile(null);
    setAnalysisResult(null);
    setIsAnalyzing(false);
  };

  // Upload mode - show file upload zone
  if (!uploadedFile) {
    return (
      <MainLayout>
        <FileUploadZone onFileUpload={handleFileUpload} />
      </MainLayout>
    );
  }

  // Analysis mode - show two-panel layout
  return (
    <MainLayout
      pdfViewer={
        <PDFViewer
          file={uploadedFile}
          onAnalysisStart={handleAnalysisStart}
          onReset={handleReset}
          isAnalyzing={isAnalyzing}
        />
      }
      analysisPanel={
        <AnalysisPanel
          analysisResult={analysisResult}
          isAnalyzing={isAnalyzing}
        />
      }
    />
  );
}
