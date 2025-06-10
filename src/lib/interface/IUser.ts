export interface IUser {
  _id?: string;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  role_id: string; // ObjectId
  status: 'active' | 'inactive';
  createdAt?: number;
  updatedAt?: number;
}
