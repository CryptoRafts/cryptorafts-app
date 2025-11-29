// Email aliases configuration for CryptoRafts
// All emails will be sent from business@cryptorafts.com but can use different "from" addresses

export interface EmailAlias {
  address: string;
  name: string;
  purpose: string;
  replyTo?: string;
}

export const emailAliases: Record<string, EmailAlias> = {
  // Main business email
  business: {
    address: 'business@cryptorafts.com',
    name: 'CryptoRafts',
    purpose: 'General business inquiries and communications',
    replyTo: 'business@cryptorafts.com',
  },

  // Support emails
  support: {
    address: 'support@cryptorafts.com',
    name: 'CryptoRafts Support',
    purpose: 'Customer support and technical assistance',
    replyTo: 'support@cryptorafts.com',
  },

  help: {
    address: 'help@cryptorafts.com',
    name: 'CryptoRafts Help',
    purpose: 'Help and assistance requests',
    replyTo: 'help@cryptorafts.com',
  },

  // Content and marketing
  blog: {
    address: 'blog@cryptorafts.com',
    name: 'CryptoRafts Blog',
    purpose: 'Blog updates and content notifications',
    replyTo: 'blog@cryptorafts.com',
  },

  // Role-specific emails
  ceo: {
    address: 'ceo@cryptorafts.com',
    name: 'CryptoRafts CEO',
    purpose: 'CEO communications and executive updates',
    replyTo: 'ceo@cryptorafts.com',
  },
  anasshamsi: {
    address: 'anasshamsi@cryptorafts.com',
    name: 'Anas Shamsi',
    purpose: 'Personal communications for Anas Shamsi',
    replyTo: 'anasshamsi@cryptorafts.com',
  },
  founder: {
    address: 'founder@cryptorafts.com',
    name: 'CryptoRafts Founders',
    purpose: 'Founder-specific communications and updates',
    replyTo: 'founder@cryptorafts.com',
  },

  vc: {
    address: 'vc@cryptorafts.com',
    name: 'CryptoRafts VC',
    purpose: 'Venture capital and investor communications',
    replyTo: 'vc@cryptorafts.com',
  },

  investor: {
    address: 'investor@cryptorafts.com',
    name: 'CryptoRafts Investors',
    purpose: 'Investor relations and updates',
    replyTo: 'investor@cryptorafts.com',
  },

  // Administrative
  admin: {
    address: 'admin@cryptorafts.com',
    name: 'CryptoRafts Admin',
    purpose: 'Administrative notifications',
    replyTo: 'admin@cryptorafts.com',
  },

  // Notifications
  notifications: {
    address: 'notifications@cryptorafts.com',
    name: 'CryptoRafts Notifications',
    purpose: 'System notifications and alerts',
    replyTo: 'notifications@cryptorafts.com',
  },

  // Legal and compliance
  legal: {
    address: 'legal@cryptorafts.com',
    name: 'CryptoRafts Legal',
    purpose: 'Legal and compliance matters',
    replyTo: 'legal@cryptorafts.com',
  },

  // Partnerships
  partnerships: {
    address: 'partnerships@cryptorafts.com',
    name: 'CryptoRafts Partnerships',
    purpose: 'Partnership inquiries and collaborations',
    replyTo: 'partnerships@cryptorafts.com',
  },
};

// Get email alias by key
export function getEmailAlias(key: string): EmailAlias {
  return emailAliases[key] || emailAliases.business;
}

// Get all email aliases
export function getAllEmailAliases(): EmailAlias[] {
  return Object.values(emailAliases);
}

// Get email address by key
export function getEmailAddress(key: string): string {
  return getEmailAlias(key).address;
}

// Get email name by key
export function getEmailName(key: string): string {
  return getEmailAlias(key).name;
}

// Alias functions for compatibility
export function getFromAddress(key: string): string {
  return getEmailAlias(key).address;
}

export function getFromName(key: string): string {
  return getEmailAlias(key).name;
}

// SMTP Configuration (Hostinger default)
export const smtpConfig = {
  host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true' || process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER || 'business@cryptorafts.com',
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || '',
  },
};