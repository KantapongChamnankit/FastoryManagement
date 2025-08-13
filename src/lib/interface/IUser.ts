export interface IUser {
  _id?: string;
  first_name: string;
  last_name: string;
  email: string;
  password_hash?: string; // Optional for OAuth users
  role_id: string; // ObjectId
  status: 'active' | 'inactive';
  image_id?: string; // ObjectId - optional
  // OAuth fields
  auth_provider?: 'credentials' | 'google';
  google_id?: string;
  createdAt?: string;
  updatedAt?: string;
}
