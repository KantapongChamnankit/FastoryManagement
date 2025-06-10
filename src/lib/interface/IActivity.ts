export interface IActivity {
  _id?: string;
  user_id: string;
  action: string;
  details?: string;
  created_at?: Date;
}
