import { SYSTEM_PROMPTS } from './ai-prompts';

export const AI_CONFIG = {
  // Model settings - Using the LATEST OpenAI o3 models
  MODEL: 'o3', // Latest reasoning model for text analysis
  VISION_MODEL: 'o3', // Latest o3 for image analysis (supports vision)
  MAX_COMPLETION_TOKENS: 4000, // Updated parameter name for o3
  // Note: o3 model only supports default temperature (1), cannot be customized
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  
  // Typography-focused analysis areas - TEMPORARILY FOCUSING ON TYPE SCALE ONLY
  ANALYSIS_AREAS: {
    TYPE_SCALE_COMPLIANCE: true, // ONLY THIS IS ACTIVE
    // TEMPORARILY DISABLED - FOCUSING ON TYPE SCALE ONLY
    // HIERARCHY_EFFECTIVENESS: true, 
    // CONSISTENCY_APPLICATION: true,
    // READABILITY_STANDARDS: true,
    // Future expansions
    MOBILE_TYPOGRAPHY: false,
    BRAND_CONSISTENCY: false
  },
  
  // Color standards for typography
  TYPOGRAPHY_COLORS: {
    PRIMARY: '#000000',
    SECONDARY: '#666666', 
    INTERACTIVE: '#007AFF',
    DISABLED: '#999999'
  },
  
  // Response preferences
  RESPONSE_STYLE: {
    TONE: 'expert-typography-focused',
    DETAIL_LEVEL: 'comprehensive',
    STRICT_ENFORCEMENT: true // Enforce 4-size maximum rule strictly
  }
};

// Environment-specific prompts with o3 optimization
export const getAnalysisPrompt = (analysisType: 'basic' | 'detailed' | 'strict' = 'basic') => {
  const basePrompt = SYSTEM_PROMPTS.UI_ANALYSIS;
  
  switch (analysisType) {
    case 'strict':
      return basePrompt + '\n\nBe extremely strict about the 4-size maximum rule. Any design using 5+ sizes should receive a score below 50.';
    case 'detailed':
      return basePrompt + '\n\nProvide extensive detail about specific font sizes found with precise measurements using o3 reasoning capabilities.';
    default:
      return basePrompt;
  }
}; 