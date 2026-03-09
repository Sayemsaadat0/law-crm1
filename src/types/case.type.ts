export type TCaseStage = "Disposed" | "Left" | "Active";

export type Hearing = {
  title: string;
  serial_no: string;
  hearing_date: string; // ISO date string (yyyy-mm-dd)
  details: string;
  // Can be a single URL (string) or an array of URLs (for multiple files)
  file?: string | string[];
};

export type Payment = {
  paid_amount: number; // better as number for calculations
  paid_date: string; // ISO date string
};

export type CourtDetails = {
  id: string;
  name: string;
  address: string;
};

export type LawyerDetails = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  details: string;
  thumbnail: string;
};

export type ClientDetails = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  details: string;
  thumbnail: string;
  account_number: string;
  account_name: string;
  account_id: string;
  description: string;
  branch: string;
  // New client fields
  referring_firm?: string;
  client_reference_number?: string;
  billing_bank_name?: string;
  // Parsed list of fee schedule file URLs (from backend JSON)
  fee_schedule_files?: string[];
};

export type PartyDetails = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  details: string;
  thumbnail: string;
  // Optional reference field for opposite party (used in edit form)
  reference?: string;
};

// Basic appellant/respondent info coming directly from case meta fields
export type CaseSideInfo = {
  name: string;
  relation: string;
};

export type TCase = {
  id: string;
  case_number: string;
  file_number: string;
  case_stage: TCaseStage;
  case_description: string;
  case_date?: string; // original case date from backend
  court_id: string;
  // DETAILS
  court_details: CourtDetails;
  lawyer_id: string;
  // DETAILS
  lawyer_details: LawyerDetails;
  client_id: string;
  // DETAILS
  client_details: ClientDetails;
  party_id: string;
  // DETAILS
  party_details: PartyDetails;
  // CASE META: sides of the case (from new API fields)
  appellant?: CaseSideInfo;
  respondent?: CaseSideInfo;
  // ACTIVITY
  hearings: Hearing[];
  payments: Payment[];
};
