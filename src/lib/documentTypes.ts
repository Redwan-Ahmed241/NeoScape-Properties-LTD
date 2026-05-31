export interface PropertyDocument {
  id: string;
  propertyId: string;
  roomId?: number;
  tenantId?: number;
  tenantUsername?: string;
  tenantEmail?: string;
  assignmentId?: number;
  uploadedBy?: string;
  name: string;
  type: 'license' | 'permit' | 'insurance' | 'contract' | 'certificate' | 'id' | 'proof_of_address' | 'reference' | 'other';
  description: string;
  fileUrl: string;
  uploadDate: string;
  expiryDate?: string;
  renewalDate?: string;
  reviewedAt?: string;
  status: 'active' | 'expiring-soon' | 'expired' | 'renewed' | 'pending' | 'approved' | 'rejected';
  reminderDays?: number;
  notes?: string;
  adminNotes?: string;
  metadata?: any;
}

export interface RentSchedule {
  id: string;
  roomId: string;
  roomName: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  monthlyRent: number;
  dueDay: number; // Day of month (1-31)
  startDate: string;
  endDate?: string;
  status: 'active' | 'paused' | 'completed';
  paymentHistory: RentPayment[];
}

export interface RentPayment {
  id: string;
  scheduleId: string;
  dueDate: string;
  paidDate?: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  paidAmount?: number;
  paymentMethod?: string;
  notes?: string;
}

export interface DocumentReminder {
  id: string;
  documentId: string;
  documentName: string;
  reminderDate: string;
  type: 'renewal' | 'expiry' | 'inspection';
  dismissed: boolean;
}

export interface RentReminder {
  id: string;
  scheduleId: string;
  roomName: string;
  tenantName: string;
  dueDate: string;
  amount: number;
  dismissed: boolean;
}

export interface BookingInterest {
  id: string;
  roomId?: number;
  roomName?: string;
  propertyName?: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  createdAt: string;
}

