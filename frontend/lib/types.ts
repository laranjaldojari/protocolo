export type Role = 'ADMIN' | 'GESTOR' | 'ATENDENTE' | 'SERVIDOR';

export interface SessionUser {
  id: string; name: string; email: string; role: Role; departmentId?: string | null;
}

export interface Department { id: string; name: string; acronym: string; active: boolean; }
export interface Subject { id: string; name: string; }

export interface Movement {
  id: string; type: string; note?: string | null; createdAt: string;
  fromDepartment?: Department | null; toDepartment?: Department | null;
  sentBy?: { name: string };
}

export interface Attachment {
  id: string; originalName: string; mimeType: string; sizeBytes: number; createdAt: string;
}

export interface Protocol {
  id: string; number: string; status: string; priority: string; description: string;
  createdAt: string; concludedAt?: string | null;
  subject: Subject; currentDepartment: Department;
  applicant: { name: string; document: string; email?: string; phone?: string };
  createdBy?: { name: string };
  movements?: Movement[]; attachments?: Attachment[];
}
