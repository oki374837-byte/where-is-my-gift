import type { ColorValue } from "react-native";

export type ItemCategory = "عنصر نادر" | "أداة استكشاف" | "مكوّن";

export type ItemDefinition = {
  id: string;
  name: string;
  description: string;
  type: ItemCategory;
  color: string;
  icon: string;
  price: number;
  usable: boolean;
  useDescription: string;
};

export const ITEM_CATALOG: readonly ItemDefinition[] = [
  {
    id: "crystal",
    name: "بلورة الفجر",
    description: "عنصر نادر يعزز مكافآت الاستكشاف.",
    type: "عنصر نادر",
    color: "#F5B84B",
    icon: "✦",
    price: 30,
    usable: true,
    useDescription: "تستخدم البلورة لتسجيل دفعة استكشاف احتياطية.",
  },
  {
    id: "map",
    name: "شظية خريطة",
    description: "أداة تكشف نقطة استكشاف قريبة.",
    type: "أداة استكشاف",
    color: "#35C2D4",
    icon: "◇",
    price: 20,
    usable: true,
    useDescription: "تفتح الشظية تلميحاً عن أقرب نقطة استكشاف.",
  },
  {
    id: "seed",
    name: "بذرة الغابة",
    description: "مكوّن يمكن جمعه وحفظه ضمن مجموعة المستكشف.",
    type: "مكوّن",
    color: "#49D17D",
    icon: "❋",
    price: 15,
    usable: false,
    useDescription: "هذا المكوّن غير قابل للاستخدام حالياً.",
  },
];

export const ITEM_CATEGORIES = ["الكل", ...Array.from(new Set(ITEM_CATALOG.map((item) => item.type)))] as const;
export const INVENTORY_CAPACITY = 40;

export function getItemDefinition(itemId: string) {
  return ITEM_CATALOG.find((item) => item.id === itemId);
}

export function getInventoryTotal(inventory: Record<string, number>) {
  return Object.values(inventory).reduce((total, quantity) => total + Math.max(0, quantity), 0);
}

export function getInventoryDefinitions(inventory: Record<string, number>) {
  return Object.entries(inventory)
    .filter(([, quantity]) => quantity > 0)
    .map(([id, amount]) => {
      const definition = getItemDefinition(id);
      return definition ? { ...definition, amount } : {
        id,
        name: "عنصر مكتشف",
        description: "عنصر مكتشف محفوظ ضمن تقدمك.",
        type: "مكوّن" as ItemCategory,
        color: "#8FA8B8",
        icon: "•",
        price: 0,
        usable: false,
        useDescription: "هذا العنصر مخصص للعرض والحفظ فقط.",
        amount,
      };
    });
}

export type CatalogColor = ColorValue;
