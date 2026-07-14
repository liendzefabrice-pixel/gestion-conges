export interface SkillResponse {
  id: number;
  name: string;
  description: string | null;
  employeeCount: number;
  createdAt: Date;
  updatedAt: Date;
}
