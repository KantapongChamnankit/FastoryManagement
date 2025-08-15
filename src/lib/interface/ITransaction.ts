import { ITransactionProduct } from "./ITransactionProduct";

export interface ITransaction {
  _id?: string;
  products: ITransactionProduct[];
  total_price: number;
  total_cost: number;
  profit: number;
  created_at?: number;
  user_id?: string;
  payment_method?: "QR" | "CASH";
  discount?: number;
  cash_received?: number;
  change?: number;
  qr_payload?: string;
}
