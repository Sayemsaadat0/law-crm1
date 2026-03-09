export interface User {
  id: number;
  name: string;
  email: string;
  mobile?: string;
  role: 'admin' | 'owner' | 'lawyer';
  image?: string;
  joining_date?: string;
  created_at?: string;
  updated_at?: string;
}

