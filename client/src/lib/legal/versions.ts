export interface LegalDocumentVersion {
  id: string;
  version: string;
  effectiveDate: Date;
  changes: string[];
}

export interface LegalDocument {
  id: string;
  title: string;
  type: 'privacy' | 'terms' | 'disclaimer';
  currentVersion: string;
  versions: LegalDocumentVersion[];
}

export const legalDocuments: LegalDocument[] = [
  {
    id: 'privacy-policy',
    title: 'Privacy Policy',
    type: 'privacy',
    currentVersion: '1.0.0',
    versions: [
      {
        id: 'privacy-1.0.0',
        version: '1.0.0',
        effectiveDate: new Date('2024-01-01'),
        changes: [
          'Initial privacy policy',
          'Added data collection details',
          'Added Plaid integration information'
        ]
      }
    ]
  },
  {
    id: 'terms-service',
    title: 'Terms of Service',
    type: 'terms',
    currentVersion: '1.0.0',
    versions: [
      {
        id: 'terms-1.0.0',
        version: '1.0.0',
        effectiveDate: new Date('2024-01-01'),
        changes: [
          'Initial terms of service',
          'Added AI services disclaimer',
          'Added user responsibilities'
        ]
      }
    ]
  }
];

export function getLatestVersion(documentId: string): LegalDocumentVersion | null {
  const document = legalDocuments.find(doc => doc.id === documentId);
  if (!document) return null;
  
  return document.versions.find(v => v.version === document.currentVersion) || null;
}

export function getDocumentHistory(documentId: string): LegalDocumentVersion[] {
  const document = legalDocuments.find(doc => doc.id === documentId);
  return document ? document.versions : [];
} 