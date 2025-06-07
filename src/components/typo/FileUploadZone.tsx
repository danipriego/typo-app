'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  AlertCircle,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { FileUpload } from '@/types/typography';

interface FileUploadZoneProps {
  onFileUpload: (file: FileUpload) => void;
}

export function FileUploadZone({ onFileUpload }: FileUploadZoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [testingOpenAI, setTestingOpenAI] = useState(false);
  const [openAIStatus, setOpenAIStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    // Validate file type - now accepting both PDF and PNG
    if (file.type !== 'application/pdf' && file.type !== 'image/png') {
      setError('Please upload a PDF or PNG file only.');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }

      setIsUploading(true);
  setError(null);
  setSuccess(false);
  setUploadProgress(0);

  try {
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 200);

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    clearInterval(progressInterval);
    setUploadProgress(100);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Upload failed');
    }

    if (result.success && result.data) {
      setSuccess(true);
      setTimeout(() => {
        onFileUpload(result.data);
      }, 500);
    } else {
      throw new Error('Upload failed - no data received');
    }

  } catch (error) {
    console.error('Upload error:', error);
    setError(error instanceof Error ? error.message : 'Upload failed');
    setUploadProgress(0);
  } finally {
    setIsUploading(false);
  }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const testOpenAIConnection = async () => {
    setTestingOpenAI(true);
    setOpenAIStatus(null);
    
    try {
      const response = await fetch('/api/health/openai');
      const result = await response.json();
      
      if (result.openai_connected) {
        setOpenAIStatus('✅ OpenAI Connected Successfully');
      } else {
        setOpenAIStatus('❌ OpenAI Connection Failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      setOpenAIStatus('❌ Network Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setTestingOpenAI(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Font Size Analysis
        </h1>
        <p className="text-lg text-gray-600">
          Upload your PDF or PNG design to detect and count font sizes for type scale compliance
        </p>
      </div>

      {/* Upload Zone */}
      <Card className="p-8">
        <div className="text-center space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,application/pdf,image/png"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          
          {isUploading ? (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Uploading file...
                </p>
                <p className="text-sm text-gray-600">
                  Please wait while we process your file
                </p>
              </div>
              <div className="max-w-xs mx-auto">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-gray-500 mt-2">
                  {Math.round(uploadProgress)}% complete
                </p>
              </div>
            </div>
          ) : success ? (
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
              <div>
                <p className="text-lg font-medium text-green-900">
                  Upload Complete!
                </p>
                <p className="text-sm text-green-600">
                  Redirecting to analysis view...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Choose your design file
                </p>
                <p className="text-sm text-gray-600">
                  Maximum 10MB • PDF or PNG format
                </p>
              </div>
              <Button onClick={handleButtonClick} disabled={isUploading} size="lg">
                <FileText className="h-4 w-4 mr-2" />
                Select PDF or PNG File
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl mb-2">📏</div>
          <h3 className="font-semibold mb-1">4-Font-Size Rule</h3>
          <p className="text-sm text-gray-600">
            Maximum 4 different font sizes for optimal hierarchy
          </p>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl mb-2">🔍</div>
          <h3 className="font-semibold mb-1">Precise Detection</h3>
          <p className="text-sm text-gray-600">
            Accurate font size counting using PDF metadata and AI vision
          </p>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl mb-2">📊</div>
          <h3 className="font-semibold mb-1">Scale Compliance</h3>
          <p className="text-sm text-gray-600">
            Type scale analysis with exact size measurements
          </p>
        </Card>
      </div>

      {/* Requirements */}
      <Card className="p-4 bg-gray-50">
        <h4 className="font-medium mb-3">File Requirements:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• PDF or PNG format</li>
          <li>• Maximum file size: 10MB</li>
          <li>• Interface designs with clear typography work best</li>
          <li>• High resolution images for accurate analysis</li>
        </ul>
      </Card>

      {/* OpenAI Connection Test */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-900">Test OpenAI Connection</h4>
            <p className="text-sm text-blue-600">Verify AI analysis is available</p>
          </div>
          <Button 
            onClick={testOpenAIConnection} 
            disabled={testingOpenAI}
            variant="outline"
            size="sm"
          >
            {testingOpenAI ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
        </div>
        {openAIStatus && (
          <div className="mt-3 text-sm font-medium">
            {openAIStatus}
          </div>
        )}
      </Card>
    </div>
  );
}