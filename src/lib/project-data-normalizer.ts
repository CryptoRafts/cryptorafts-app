/**
 * Shared utility for normalizing project data (documents, team, RaftAI)
 * Used across all role project detail pages
 */

export interface NormalizedProject {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  documents: Record<string, string>;
  team: any[];
  raftai: any;
  [key: string]: any;
}

/**
 * Check if a value is a valid document URL
 */
function isValidDocumentUrl(value: any): boolean {
  if (!value) return false;
  if (typeof value === 'string' && value.trim() !== '') {
    const trimmed = value.trim();
    if (trimmed.startsWith('http://') || 
        trimmed.startsWith('https://') || 
        trimmed.startsWith('/') || 
        trimmed.startsWith('uploads/') ||
        trimmed.startsWith('gs://') ||
        trimmed.length > 10) {
      return true;
    }
  }
  if (typeof value === 'object' && value !== null) {
    const url = value.downloadURL || value.fileUrl || value.url || value.downloadUrl || value.fileURL || value.href || value.path;
    if (url && typeof url === 'string' && url.trim() !== '') {
      return true;
    }
    const urlProps = Object.values(value).find((val: any) => 
      typeof val === 'string' && val.trim() !== '' && (
        val.startsWith('http://') || 
        val.startsWith('https://') || 
        val.startsWith('/') ||
        val.startsWith('uploads/') ||
        val.startsWith('gs://')
      )
    );
    if (urlProps) return true;
  }
  if (typeof value === 'object' && value !== null && value.type && value.size && value.name && !value.url && !value.downloadURL && !value.fileUrl) {
    return false;
  }
  return false;
}

/**
 * Extract URL from a document value
 */
function extractDocumentUrl(value: any): string | null {
  if (!value) return null;
  if (typeof value === 'string' && value.trim() !== '') {
    return value.trim();
  }
  if (typeof value === 'object' && value !== null) {
    const url = value.downloadURL || value.fileUrl || value.url || value.downloadUrl || value.fileURL || value.href || value.path;
    if (url && typeof url === 'string' && url.trim() !== '') {
      return url.trim();
    }
    const urlProps = Object.values(value).find((val: any) => 
      typeof val === 'string' && val.trim() !== '' && (
        val.startsWith('http://') || 
        val.startsWith('https://') || 
        val.startsWith('/') ||
        val.startsWith('uploads/') ||
        val.startsWith('gs://')
      )
    );
    if (urlProps && typeof urlProps === 'string') {
      return urlProps.trim();
    }
  }
  return null;
}

/**
 * Check if data looks like valid RaftAI analysis
 */
function isValidRaftAIData(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  // Check for common RaftAI fields
  const hasScore = data.score !== undefined || data.overallScore !== undefined || data.totalScore !== undefined;
  const hasRating = data.rating !== undefined || data.riskRating !== undefined;
  const hasSummary = data.summary !== undefined || data.analysis !== undefined || data.assessment !== undefined;
  const hasInsights = Array.isArray(data.insights) && data.insights.length > 0;
  const hasRisks = Array.isArray(data.risks) && data.risks.length > 0;
  const hasRecommendations = Array.isArray(data.recommendations) && data.recommendations.length > 0;
  
  return hasScore || hasRating || hasSummary || hasInsights || hasRisks || hasRecommendations;
}

/**
 * Normalize project data - extract documents, team, and RaftAI
 */
export function normalizeProjectData(rawData: any, projectId: string): NormalizedProject {
  const projectData: NormalizedProject = {
    id: projectId,
    ...rawData,
    documents: {},
    team: [],
    raftai: null
  };

  // Normalize documents
  const documentsData: Record<string, string> = {};
  
  // Check root-level documents
  if (rawData?.documents && typeof rawData.documents === 'object' && !Array.isArray(rawData.documents)) {
    Object.entries(rawData.documents).forEach(([key, value]: [string, any]) => {
      if (isValidDocumentUrl(value)) {
        const url = extractDocumentUrl(value);
        if (url) documentsData[key] = url;
      }
    });
  }
  
  // Check pitch.data.documents
  if (rawData?.pitch?.data?.documents && typeof rawData.pitch.data.documents === 'object' && !Array.isArray(rawData.pitch.data.documents)) {
    Object.entries(rawData.pitch.data.documents).forEach(([key, value]: [string, any]) => {
      if (isValidDocumentUrl(value) && !documentsData[key]) {
        const url = extractDocumentUrl(value);
        if (url) documentsData[key] = url;
      }
    });
  }
  
  // Check individual document fields
  const docFields = ['whitepaper', 'whitepaperUrl', 'pitchDeck', 'pitchDeckUrl', 'pitchdeck', 
    'financials', 'financialProjections', 'auditReport', 'audit', 'tokenomics', 'roadmap'];
  
  docFields.forEach(field => {
    const value = rawData?.[field] || rawData?.pitch?.[field] || rawData?.pitch?.data?.[field];
    if (isValidDocumentUrl(value)) {
      const url = extractDocumentUrl(value);
      if (url) {
        let docKey = field.includes('whitepaper') ? 'whitepaper' :
                     field.includes('pitch') || field.includes('deck') ? 'pitchDeck' :
                     field.includes('financial') ? 'financials' :
                     field.includes('audit') ? 'auditReport' :
                     field.includes('token') ? 'tokenomics' :
                     field.includes('roadmap') ? 'roadmap' : field;
        if (!documentsData[docKey]) documentsData[docKey] = url;
      }
    }
  });
  
  // Filter out invalid entries
  const filteredDocs: Record<string, string> = {};
  Object.entries(documentsData).forEach(([key, value]) => {
    if (value && typeof value === 'string' && value.trim() !== '') {
      filteredDocs[key] = value;
    }
  });
  
  projectData.documents = filteredDocs;
  
  // Normalize team
  let teamData: any[] = [];
  
  if (Array.isArray(rawData?.team)) {
    teamData = rawData.team;
  } else if (Array.isArray(rawData?.teamMembers)) {
    teamData = rawData.teamMembers;
  } else if (Array.isArray(rawData?.pitch?.team)) {
    teamData = rawData.pitch.team;
  } else if (Array.isArray(rawData?.pitch?.data?.team)) {
    teamData = rawData.pitch.data.team;
  } else if (Array.isArray(rawData?.pitch?.data?.teamMembers)) {
    teamData = rawData.pitch.data.teamMembers;
  } else if (rawData?.team && typeof rawData.team === 'object' && !Array.isArray(rawData.team)) {
    // Convert object to array
    teamData = Object.values(rawData.team);
  }
  
  projectData.team = teamData;
  
  // Normalize RaftAI
  let raftaiData: any = null;
  
  // Check multiple possible locations
  if (isValidRaftAIData(rawData?.raftai)) {
    raftaiData = rawData.raftai;
  } else if (isValidRaftAIData(rawData?.raftAI)) {
    raftaiData = rawData.raftAI;
  } else if (isValidRaftAIData(rawData?.aiAnalysis)) {
    raftaiData = rawData.aiAnalysis;
  } else if (isValidRaftAIData(rawData?.pitch?.raftai)) {
    raftaiData = rawData.pitch.raftai;
  } else if (isValidRaftAIData(rawData?.pitch?.raftAI)) {
    raftaiData = rawData.pitch.raftAI;
  } else if (isValidRaftAIData(rawData?.pitch?.data?.raftai)) {
    raftaiData = rawData.pitch.data.raftai;
  } else if (isValidRaftAIData(rawData?.pitch?.data?.raftAI)) {
    raftaiData = rawData.pitch.data.raftAI;
  }
  
  // Normalize RaftAI structure
  if (raftaiData) {
    const normalized: any = { ...raftaiData };
    normalized.score = normalized.score || normalized.overallScore || normalized.totalScore || null;
    normalized.rating = normalized.rating || normalized.riskRating || null;
    normalized.summary = normalized.summary || normalized.analysis || normalized.assessment || null;
    normalized.insights = normalized.insights || [];
    normalized.risks = normalized.risks || [];
    normalized.recommendations = normalized.recommendations || [];
    raftaiData = normalized;
  }
  
  projectData.raftai = raftaiData;
  
  return projectData;
}

