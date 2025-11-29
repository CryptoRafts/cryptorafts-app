/**
 * Utility functions for project data handling
 */

/**
 * Comprehensive logo URL extraction from project data
 * Checks all possible locations where logo might be stored
 */
export function extractProjectLogoUrl(project: any): string | null {
  if (!project) return null;

  // Try top-level logo first (most direct)
  if (project.logo) {
    if (typeof project.logo === 'string' && project.logo.startsWith('http')) return project.logo;
    if (project.logo.url && typeof project.logo.url === 'string' && project.logo.url.startsWith('http')) return String(project.logo.url);
    if (project.logo.downloadURL && typeof project.logo.downloadURL === 'string' && project.logo.downloadURL.startsWith('http')) return String(project.logo.downloadURL);
  }

  // Try projectLogo at top level (new field)
  if (project.projectLogo) {
    if (typeof project.projectLogo === 'string' && project.projectLogo.startsWith('http')) return project.projectLogo;
    if (project.projectLogo.url && typeof project.projectLogo.url === 'string' && project.projectLogo.url.startsWith('http')) return String(project.projectLogo.url);
    if (project.projectLogo.downloadURL && typeof project.projectLogo.downloadURL === 'string' && project.projectLogo.downloadURL.startsWith('http')) return String(project.projectLogo.downloadURL);
  }

  // Try logoUrl (alternative field name)
  if (project.logoUrl) {
    if (typeof project.logoUrl === 'string' && project.logoUrl.startsWith('http')) return project.logoUrl;
  }

  // Try image (alternative field name)
  if (project.image) {
    if (typeof project.image === 'string' && project.image.startsWith('http')) return project.image;
  }

  // Try pitch.documents.projectLogo
  const pitchLogo = project.pitch?.documents?.projectLogo;
  if (pitchLogo) {
    if (typeof pitchLogo === 'string' && pitchLogo.startsWith('http')) return pitchLogo;
    if (pitchLogo.url && typeof pitchLogo.url === 'string' && pitchLogo.url.startsWith('http')) return String(pitchLogo.url);
    if (pitchLogo.downloadURL && typeof pitchLogo.downloadURL === 'string' && pitchLogo.downloadURL.startsWith('http')) return String(pitchLogo.downloadURL);
  }

  // Try top-level documents.projectLogo
  const docLogo = project.documents?.projectLogo;
  if (docLogo) {
    if (typeof docLogo === 'string' && docLogo.startsWith('http')) return docLogo;
    if (docLogo.url && typeof docLogo.url === 'string' && docLogo.url.startsWith('http')) return String(docLogo.url);
    if (docLogo.downloadURL && typeof docLogo.downloadURL === 'string' && docLogo.downloadURL.startsWith('http')) return String(docLogo.downloadURL);
  }

  // Try documents.logo (alternative structure)
  const docLogoAlt = project.documents?.logo;
  if (docLogoAlt) {
    if (typeof docLogoAlt === 'string' && docLogoAlt.startsWith('http')) return docLogoAlt;
    if (docLogoAlt.url && typeof docLogoAlt.url === 'string' && docLogoAlt.url.startsWith('http')) return String(docLogoAlt.url);
    if (docLogoAlt.downloadURL && typeof docLogoAlt.downloadURL === 'string' && docLogoAlt.downloadURL.startsWith('http')) return String(docLogoAlt.downloadURL);
  }

  return null;
}

