export interface TaskType {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low" | "urgent" ;
  category: string;
  completed: boolean;
  scheduled: boolean;
  date: Date | null; 
  parentId?: string; 
  resources: TaskResources[]; 
  startTime?: Date; 
  endTime?: Date; 
  duration?: number; 
  tags?: string[];
  status?: string;
  order?: number;
  assignedTo?: AssignedUser[];
  projectId?: string | null;
  teamId?: string;
  createdAt?: Date;
}

export interface AssignedUser {
  id: string;
  name: string;
  profilePic?: string;
}

export interface TaskResources {
  id: string;
  name: string;
  type: string;
  category: "file" | "link" | "note";
  url?: string;
}
