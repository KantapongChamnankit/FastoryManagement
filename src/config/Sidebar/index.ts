import { FileText, Home, Lock, Package, ShoppingCart, Tags, Users } from "lucide-react";

export const SidebarConfig = [
  {
    label: "dashboard",
    items: [
      {
        title: "dashboard",
        url: "/home/dashboard",
        icon: Home,
      },
      {
        title: "products",
        url: "/home/products",
        icon: Package,
      },
      {
        title: "sellProduct",
        url: "/home/sell",
        icon: ShoppingCart,
      },
    ],
  },
  {
    label: "management",
    items: [
      {
        title: "categories",
        url: "/home/categories",
        icon: Tags,
      },
      {
        title: "storageLocks",
        url: "/home/locks",
        icon: Lock,
      },
      {
        title: "userManagement",
        url: "/home/users",
        icon: Users,
      },
    ],
  },
  {
    label: "reports",
    items: [
      {
        title: "reports",
        url: "/home/reports",
        icon: FileText,
      },
    ],
  },
]