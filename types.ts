
export type AppView = 'home' | 'new_search' | 'workspaces' | 'profile' | 'settings';

export interface PropertyData {
  id: string;
  contactName: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  companyAddress?: string;
  propertySize?: string;
  lastSale?: string;
}

export interface GroundingSource {
  uri: string;
  title?: string;
}

export interface BestContact {
  phone: string | null;
  email: string | null;
  confidence: 'High' | 'Medium' | 'Low' | null;
}

export interface AltContact {
  phone: string | null;
  email: string | null;
  note: string;
}

export interface DataSource {
  label: string;
  url: string;
  data_point: string;
}

// RawGeminiResponse is the direct output expected from the Zuno Agent prompt.
export interface RawGeminiResponse {
  subject?: string;
  best_contact?: BestContact;
  alt_contacts?: AltContact[];
  search_log?: string[];
  sources?: DataSource[];
  generated_at?: string;
  
  error?: string; 
  status?: "no_match";
  message?: string; 
  groundingSources?: GroundingSource[]; // From Gemini API itself
}


export interface SearchResult extends RawGeminiResponse {
  // If SearchResult needs to differ from RawGeminiResponse structure in the future
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date; 
  isLoading?: boolean; // Optional: to show AI thinking indicator
}

export interface NearMeProperty {
  id:string; // Could be generated client-side or from AI if provided
  address: string;
  city: string;
  state: string;
  description: string;
  reasonForBenefit: string;
}

export type ThemePreference = 'dark' | 'light';

// Represents a user's static profile for display purposes.
export interface UserProfile {
  id: string; 
  name: string;
  title: string;
  bio: string;
  avatarUrl: string | null;
  expertise: string[];
  interests: string[];
  contactEmail?: string;
  contactPhone?: string;
  linkedInProfile?: string;
  theme: ThemePreference;
}


// ExcelRow combines original PropertyData with enriched data from RawGeminiResponse.
export interface ExcelRow extends PropertyData {
  // From new AI response
  subject?: string;
  best_phone?: string | null;
  best_email?: string | null;
  confidence?: string | null;
  
  alt_contacts_json?: string | null; // Store array as JSON string
  search_log_text?: string | null; // Store array as string
  sources_json?: string | null; // Store array as JSON string
  
  generated_at?: string;
  
  ai_status?: 'success' | 'no_match' | 'error';
  ai_message?: string;
  
  groundingSources?: GroundingSource[];
}

export interface Workspace {
  id: string;
  name: string;
  createdAt: string; // ISO string for localStorage
  searches: ExcelRow[];
}

export type DataEntryMode = 'upload' | 'manualSearch';

export interface ProcessingSummary {
  totalRecords: number;
  recordsSuccessfullyProcessed: number; // Records where AI didn't return an "error" status
  recordsWithContacts: number; // Records with at least one phone number or email
  errorsEncountered: number; // Count of records that resulted in an "error" status from AI
  detailedErrors: { recordDetail: string; message: string }[];
}
