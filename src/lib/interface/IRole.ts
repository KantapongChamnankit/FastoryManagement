export interface IRole {
  _id?: string;
  name: string;
  permissions: {
    [key: string]: string[]; // ตัวอย่าง: { products: ["read", "create"] }
  };
}
