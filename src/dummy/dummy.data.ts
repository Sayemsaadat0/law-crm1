import type { TCase } from "@/types/case.type";

// Court type
export type TCourt = {
  id: string;
  name: string;
  address: string;
  status: "Active" | "Inactive";
};

// Dummy court data
export const dummyCourts: TCourt[] = [
  {
    id: "court-001",
    name: "District Court - Civil Division",
    address: "123 Main Street, Dhaka, Bangladesh",
    status: "Active",
  },
  {
    id: "court-002",
    name: "High Court - Criminal Division",
    address: "456 Justice Avenue, Dhaka, Bangladesh",
    status: "Active",
  },
  {
    id: "court-003",
    name: "Supreme Court",
    address: "789 Legal Plaza, Dhaka, Bangladesh",
    status: "Active",
  },
  {
    id: "court-004",
    name: "Family Court",
    address: "321 Family Road, Chattogram, Bangladesh",
    status: "Active",
  },
  {
    id: "court-005",
    name: "Commercial Court",
    address: "654 Business District, Sylhet, Bangladesh",
    status: "Inactive",
  },
];

export const dummyCase: TCase[] = [{
    id: "case-001",
    case_number: "DC-2024-001",
    file_number: "FILE-2024-001",
    case_stage: "Active",
    case_description: "Property dispute involving ancestral land ownership between family members.",
  
    court_id: "court-001",
    court_details: {
      id: "court-001",
      name: "District Court - Civil Division",
      address: "123 Main Street, Dhaka, Bangladesh",
    },
  
    lawyer_id: "lawyer-001",
    lawyer_details: {
      id: "lawyer-001",
      name: "Sarah Johnson",
      email: "sarah.johnson@lawfirm.com",
      phone: "+880-1712-345678",
      address: "456 Legal Avenue, Dhaka, Bangladesh",
      details: "Senior Advocate with 15 years of experience in civil and property law.",
      thumbnail: "https://example.com/lawyers/sarah-johnson.jpg",
    },
  
    client_id: "client-001",
    client_details: {
      id: "client-001",
      name: "Md. Abdul Karim",
      email: "abdul.karim@email.com",
      phone: "+880-1711-234567",
      address: "789 Residential Road, Dhaka, Bangladesh",
      details: "Property owner claiming ownership based on inheritance documents.",
      thumbnail: "https://example.com/clients/abdul-karim.jpg",
      account_number: "ACC-1001",
      account_name: "Abdul Karim",
      account_id: "CLI-001",
      description: "Primary client in property dispute case",
      branch: "Dhaka Main Branch",
    },
  
    party_id: "party-001",
    party_details: {
      id: "party-001",
      name: "Md. Rahman Ali",
      email: "rahman.ali@email.com",
      phone: "+880-1713-456789",
      address: "321 Family Street, Dhaka, Bangladesh",
      details: "Younger brother claiming equal share of property.",
      thumbnail: "https://example.com/parties/rahman-ali.jpg",
    },
  
    hearings: [
      {
        title: "Evidence Submission Hearing",
        serial_no: "HE-001",
        hearing_date: "2025-12-12",
        details: "Evidence submission hearing. Additional evidence and expert opinions were presented.",
        file: "https://example.com/files/hearing-evidence-001.pdf",
      },
      {
        title: "Witness Examination Session",
        serial_no: "HE-002",
        hearing_date: new Date().toISOString().split('T')[0],
        details: "Current hearing scheduled for today. Witness examination and cross-examination session.",
        file: "https://example.com/files/hearing-witness-002.pdf",
      },
      {
        title: "Final Arguments Hearing",
        serial_no: "HE-003",
        hearing_date: "2025-01-15",
        details: "Next hearing scheduled for final arguments from both parties.",
        file: "https://example.com/files/hearing-arguments-003.pdf",
      },
    ],
  
    payments: [
      {
        paid_amount: 5000,
        paid_date: "2024-08-01",
      },
      {
        paid_amount: 3000,
        paid_date: "2024-09-10",
      },
      {
        paid_amount: 4000,
        paid_date: "2024-10-15",
      },
    ],
  }];




// Dummy lawyer data
export const dummyLawyers = [
  {
    id: "lawyer-001",
    name: "Sarah Johnson",
  },
  {
    id: "lawyer-002",
    name: "Michael Chen",
  },
  {
    id: "lawyer-003",
    name: "John Doe",
  },
  {
    id: "lawyer-004",
    name: "Jane Smith",
  },
];

export const dummyMembers = [
  {
    id: "member-001",
    name: "Sarah Johnson",
    email: "sarah.johnson@lawfirm.com",
    phone: "+880-1712-345678",
    role: "Lawyers",
    thumbnail: "https://i.pinimg.com/736x/ff/74/2d/ff742d89abb3d60cdbdcd29eb49f87fd.jpg",
  },
  {
    id: "member-002",
    name: "Md. Abdul Karim",
    email: "abdul.karim@email.com",
    phone: "+880-1711-234567",
    role: "Owner",
    thumbnail: "https://i.pinimg.com/736x/ff/74/2d/ff742d89abb3d60cdbdcd29eb49f87fd.jpg",
  },
  {
    id: "member-003",
    name: "Michael Chen",
    email: "michael.chen@lawfirm.com",
    phone: "+880-1713-456789",
    role: "Lawyers",
    thumbnail: "https://i.pinimg.com/736x/ff/74/2d/ff742d89abb3d60cdbdcd29eb49f87fd.jpg",
  },
  {
    id: "member-004",
    name: "Emily Davis",
    email: "emily.davis@email.com",
    phone: "+880-1714-567890",
    role: "Admin",
    thumbnail: "https://i.pinimg.com/736x/ff/74/2d/ff742d89abb3d60cdbdcd29eb49f87fd.jpg",
  },
  {
    id: "member-005",
    name: "David Wilson",
    email: "david.wilson@lawfirm.com",
    phone: "+880-1715-678901",
    role: "Admin",
    thumbnail: "https://i.pinimg.com/736x/ff/74/2d/ff742d89abb3d60cdbdcd29eb49f87fd.jpg",
  },
];
  