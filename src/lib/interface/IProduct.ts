export interface IProduct {
  _id?: string;
  barcode: string;
  name: string;
  category_id: string;
  stock_location_id: string;
  quantity: number;
  cost: number;
  price: number;
  image_id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
