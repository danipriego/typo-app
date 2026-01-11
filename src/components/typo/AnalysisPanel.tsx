'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  FileText,
  Loader2
} from 'lucide-react';
import { TypographyAnalysis } from '@/types/typography';

interface AnalysisPanelProps {
  analysisResult: TypographyAnalysis | null;
  isAnalyzing: boolean;
}

export function AnalysisPanel({ 
  analysisResult, 
  isAnalyzing 
}: AnalysisPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Show progress during analysis
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    
    if (isAnalyzing) {
      setAnalysisProgress(0);
      setError(null);
      
      // Simulate progress for user feedback
      progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 2000);

      return () => {
        clearInterval(progressInterval);
      };
    }
  }, [isAnalyzing]);

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'high':
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Loading state
  if (isAnalyzing) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <h3 className="text-lg font-semibold">Analyzing Typography</h3>
            <p className="text-gray-600">
              AI is examining your design for typography compliance...
            </p>
            <div className="space-y-2">
              <Progress value={analysisProgress} className="w-full" />
              <p className="text-sm text-gray-500">
                {Math.round(analysisProgress)}% complete
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <h4 className="font-medium mb-3">What we&apos;re checking:</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Font size detection and counting</li>
            <li>• 4-font-size rule compliance</li>
            <li>• Typography hierarchy effectiveness</li>
            <li>• Consistency across design</li>
            <li>• Readability standards</li>
          </ul>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // No analysis state
  if (!analysisResult) {
    return (
      <Card className="p-8 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Ready for Complete Typography Analysis
        </h3>
        <p className="text-gray-600 mb-4">
          Click &quot;Analyze Typography&quot; to get comprehensive typography analysis including hierarchy, consistency, and readability insights.
        </p>
        <div className="text-sm text-gray-500">
          <p>✓ 4-font-size rule enforcement</p>
          <p>✓ Hierarchy effectiveness analysis</p>
          <p>✓ Consistency evaluation</p>
          <p>✓ Readability standards assessment</p>
        </div>
      </Card>
    );
  }

  // Analysis results
  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Overall Score</h3>
          <Badge variant={getScoreBadgeVariant(analysisResult.overall_score)}>
            {analysisResult.overall_score}/100
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Font Sizes Detected</p>
            <p className={`text-2xl font-bold ${analysisResult.exceeds_size_limit ? 'text-red-600' : 'text-green-600'}`}>
              {analysisResult.font_sizes_detected}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Compliance Status</p>
            <div className="flex items-center space-x-2">
              {analysisResult.compliance_summary.passes_size_limit ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className={analysisResult.compliance_summary.passes_size_limit ? 'text-green-600' : 'text-red-600'}>
                {analysisResult.compliance_summary.passes_size_limit ? 'Compliant' : 'Non-compliant'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {getSeverityIcon(analysisResult.compliance_summary.severity_level)}
          <span className="text-sm capitalize">
            {analysisResult.compliance_summary.severity_level} severity
          </span>
          <span className="text-sm text-gray-500">
            • {analysisResult.compliance_summary.total_violations} violations
          </span>
        </div>
      </Card>

      {/* Priority Issues & Quick Wins */}
      {(analysisResult.priority_issues.length > 0 || analysisResult.quick_wins.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysisResult.priority_issues.length > 0 && (
            <Card className="p-4">
              <h4 className="font-semibold text-red-600 mb-3 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Priority Issues
              </h4>
              <ul className="space-y-2">
                {analysisResult.priority_issues.map((issue, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    {issue}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {analysisResult.quick_wins.length > 0 && (
            <Card className="p-4">
              <h4 className="font-semibold text-green-600 mb-3 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Quick Wins
              </h4>
              <ul className="space-y-2">
                {analysisResult.quick_wins.map((win, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    {win}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {/* Detailed Analysis - COMPLETE TABS INTERFACE */}
      <Card className="p-6">
        <Tabs defaultValue="scale-compliance" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scale-compliance">Scale</TabsTrigger>
            <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
            <TabsTrigger value="consistency">Consistency</TabsTrigger>
            <TabsTrigger value="readability">Readability</TabsTrigger>
          </TabsList>

          <TabsContent value="scale-compliance" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Type Scale Compliance</h4>
              <Badge variant={getScoreBadgeVariant(analysisResult.analysis.type_scale_compliance.score)}>
                {analysisResult.analysis.type_scale_compliance.score}/100
              </Badge>
            </div>
            <div className="text-gray-700 whitespace-pre-line">{analysisResult.analysis.type_scale_compliance.feedback.replace(/\\n/g, "\n")}</div>
            
            {analysisResult.analysis.type_scale_compliance.detected_sizes && (
              <div>
                <p className="font-medium mb-2">Detected Font Sizes:</p>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.analysis.type_scale_compliance.detected_sizes.map((size, index) => (
                    <Badge key={index} variant="outline">{size}</Badge>
                  ))}
                </div>
              </div>
            )}

            {analysisResult.analysis.type_scale_compliance.recommended_scale && (
              <div>
                <p className="font-medium mb-2">Recommended Scale:</p>
                <Badge variant="secondary">
                  {analysisResult.analysis.type_scale_compliance.recommended_scale}
                </Badge>
              </div>
            )}

            <div>
              <p className="font-medium mb-2">Recommendations:</p>
              <ul className="space-y-1">
                {analysisResult.analysis.type_scale_compliance.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-gray-700">{rec}</li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="hierarchy" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Hierarchy Effectiveness</h4>
              <Badge variant={getScoreBadgeVariant(analysisResult.analysis.hierarchy_effectiveness.score)}>
                {analysisResult.analysis.hierarchy_effectiveness.score}/100
              </Badge>
            </div>
            <p className="text-gray-700">{analysisResult.analysis.hierarchy_effectiveness.feedback}</p>
            
            {analysisResult.analysis.hierarchy_effectiveness.hierarchy_issues && analysisResult.analysis.hierarchy_effectiveness.hierarchy_issues.length > 0 && (
              <div>
                <p className="font-medium mb-2">Issues Found:</p>
                <ul className="space-y-1">
                  {analysisResult.analysis.hierarchy_effectiveness.hierarchy_issues.map((issue, index) => (
                    <li key={index} className="text-sm text-red-600">{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="font-medium mb-2">Recommendations:</p>
              <ul className="space-y-1">
                {analysisResult.analysis.hierarchy_effectiveness.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-gray-700">{rec}</li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="consistency" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Consistency Application</h4>
              <Badge variant={getScoreBadgeVariant(analysisResult.analysis.consistency_application.score)}>
                {analysisResult.analysis.consistency_application.score}/100
              </Badge>
            </div>
            <p className="text-gray-700">{analysisResult.analysis.consistency_application.feedback}</p>
            
            {analysisResult.analysis.consistency_application.inconsistencies_found && analysisResult.analysis.consistency_application.inconsistencies_found.length > 0 && (
              <div>
                <p className="font-medium mb-2">Inconsistencies Found:</p>
                <ul className="space-y-1">
                  {analysisResult.analysis.consistency_application.inconsistencies_found.map((issue, index) => (
                    <li key={index} className="text-sm text-yellow-600">{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="font-medium mb-2">Recommendations:</p>
              <ul className="space-y-1">
                {analysisResult.analysis.consistency_application.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-gray-700">{rec}</li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="readability" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Readability Standards</h4>
              <Badge variant={getScoreBadgeVariant(analysisResult.analysis.readability_standards.score)}>
                {analysisResult.analysis.readability_standards.score}/100
              </Badge>
            </div>
            <p className="text-gray-700">{analysisResult.analysis.readability_standards.feedback}</p>
            
            {analysisResult.analysis.readability_standards.readability_issues && analysisResult.analysis.readability_standards.readability_issues.length > 0 && (
              <div>
                <p className="font-medium mb-2">Readability Issues:</p>
                <ul className="space-y-1">
                  {analysisResult.analysis.readability_standards.readability_issues.map((issue, index) => (
                    <li key={index} className="text-sm text-orange-600">{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="font-medium mb-2">Recommendations:</p>
              <ul className="space-y-1">
                {analysisResult.analysis.readability_standards.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-gray-700">{rec}</li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
} 