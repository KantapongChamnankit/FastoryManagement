export interface IUser {
  _id?: string;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  role_id: string; // ObjectId
  status: 'active' | 'inactive';
  notification: {
    id: string;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    timestamp: number;
    read: boolean;
  }[];
  createdAt?: string;
  updatedAt?: string;
}
