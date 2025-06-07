// Typography Analysis Types
export interface TypographyAnalysis {
  overall_score: number;
  font_sizes_detected: number;
  exceeds_size_limit: boolean;
  analysis: {
    type_scale_compliance: AnalysisSection;
    hierarchy_effectiveness: AnalysisSection;
    consistency_application: AnalysisSection;
    readability_standards: AnalysisSection;
  };
  priority_issues: string[];
  quick_wins: string[];
  compliance_summary: {
    passes_size_limit: boolean;
    total_violations: number;
    severity_level: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface AnalysisSection {
  score: number;
  feedback: string;
  recommendations: string[];
  detected_sizes?: string[];
  recommended_scale?: 'compact' | 'balanced' | 'spacious';
  hierarchy_issues?: string[];
  inconsistencies_found?: string[];
  readability_issues?: string[];
}

// File Upload Types
export interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  filepath: string;
  fileHash: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

// API Response Types
export interface AnalysisResponse {
  success: boolean;
  data?: TypographyAnalysis;
  error?: string;
  cached?: boolean;
}

export interface UploadResponse {
  success: boolean;
  data?: FileUpload;
  error?: string;
}

// Type Scales
export const TYPE_SCALES = {
  COMPACT: [22, 18, 14, 11],
  BALANCED: [28, 20, 16, 12],
  SPACIOUS: [32, 24, 18, 14]
} as const;

export type TypeScale = keyof typeof TYPE_SCALES; 