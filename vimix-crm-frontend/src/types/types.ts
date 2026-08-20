export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  createdAt: string;
  notes?: string;
  projects?: Project[];
}

export interface Project {
  id: string;
  clientId: string;
  title: string;
  service: ServiceType;
  stage: ProjectStage;
  totalPayments: number;
  createdAt: string;
  description?: string;
  budget?: number;
  deadline?: string;
  documents?: ProjectDocuments;
  meetings?: Meeting[];
  stageHistory?: StageHistoryEntry[];
  activityLog?: ActivityLogEntry[];
  payments?: Payment[];
}

export interface ActivityLogEntry {
  id: string;
  type: 'stage_change' | 'document_upload' | 'document_update' | 'document_delete' | 'project_created' | 'project_updated' | 'meeting_added' | 'payment_added';
  description: string;
  timestamp: string;
  details?: {
    fromStage?: ProjectStage;
    toStage?: ProjectStage;
    documentType?: string;
    documentName?: string;
    meetingTitle?: string;
    paymentAmount?: number;
    [key: string]: any;
  };
}

export interface Meeting {
  id: string;
  date: string;
  time: string;
  title: string;
  notes?: string;
  summary?: DocumentFile;
}

export interface StageHistoryEntry {
  stage: ProjectStage;
  date: string;
  notes?: string;
}

export interface ProjectDocuments {
  sow?: DocumentFile;
  proposal?: DocumentFile;
  signedAgreement?: DocumentFile;
  nda?: DocumentFile;
  srs?: DocumentFile;
}

export interface DocumentFile {
  name: string;
  uploadDate: string;
  size: number;
  url?: string;
}

export interface Payment {
  id: string;
  projectId: string;
  clientId: string;
  clientName: string;
  projectTitle: string;
  amount: number;
  date: string;
  description: string;
  status: 'paid' | 'pending' | 'overdue';
}

export type ServiceType = 
  | 'app-development'
  | 'vapt-testing'
  | 'compliance'
  | 'business-intelligence'
  | 'bi-visualization'
  | 'video-editing'
  | 'market-consulting';

export type ProjectStage = 
  | 'enquiry'
  | 'sow-provided'
  | 'proposal-sent'
  | 'negotiation'
  | 'prototyping'
  | 'signed-agreement'
  | 'closed'
  | 'deal-lost';

export const SERVICES: { [key in ServiceType]: { label: string; color: string } } = {
  'app-development': { label: 'App Development', color: 'bg-blue-100 text-blue-800' },
  'vapt-testing': { label: 'VAPT Testing', color: 'bg-red-100 text-red-800' },
  'compliance': { label: 'Compliance', color: 'bg-green-100 text-green-800' },
  'business-intelligence': { label: 'Business Intelligence & Analytics', color: 'bg-purple-100 text-purple-800' },
  'bi-visualization': { label: 'BI Visualization', color: 'bg-indigo-100 text-indigo-800' },
  'video-editing': { label: 'Video Editing', color: 'bg-pink-100 text-pink-800' },
  'market-consulting': { label: 'Market Consulting', color: 'bg-orange-100 text-orange-800' }
};

export const STAGES: { [key in ProjectStage]: { label: string; order: number } } = {
  'enquiry': { label: 'Enquiry', order: 1 },
  'sow-provided': { label: 'SoW Provided', order: 2 },
  'proposal-sent': { label: 'Proposal Sent', order: 3 },
  'negotiation': { label: 'Negotiation & Budget Conclusion', order: 4 },
  'prototyping': { label: 'Prototyping', order: 5 },
  'signed-agreement': { label: 'Signed Agreement for 6 Months', order: 6 },
  'closed': { label: 'Closed', order: 7 },
  'deal-lost': { label: 'Deal Lost', order: 8 }
};