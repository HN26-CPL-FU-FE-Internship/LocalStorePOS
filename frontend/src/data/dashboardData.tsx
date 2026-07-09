import type {
  StatCardData,
  CustomerSearchResult,
  OrderSearchResult,
  KitchenSearchResult,
  NotificationGroup,
  TopSellingItem,
  CategoryStat,
  ActiveOrder,
  SalesSummaryItem,
  TrendingMenu,
  AvatarStackItem,
  ReservationItem,
  TableAvailability,
  ActivityLogGroup,
} from "../types";

export const dashboardStats: StatCardData[] = [
  {
    id: "total-orders",
    value: "6986",
    change: { value: "+12.5%", trend: "up" },
    label: "Total Orders",
    icon: "box",
    color: "purple",
  },
  {
    id: "total-sales",
    value: "$7516",
    change: { value: "+12.5%", trend: "up" },
    label: "Total Sales",
    icon: "badge-dollar-sign",
    color: "primary",
  },
  {
    id: "average-value",
    value: "$25.36",
    change: { value: "-8.5%", trend: "down" },
    label: "Average Value",
    icon: "diamond-percent",
    color: "orange",
  },
  {
    id: "reservations",
    value: "496",
    change: { value: "+12.5%", trend: "up" },
    label: "Reservations",
    icon: "calendar-fold",
    color: "success",
  },
];

export const customerSearchResults: CustomerSearchResult[] = [
  { id: "c1", name: "Adrian James", gender: "Male", code: "#CR6569", avatarUrl: "/restaurant-pos/src/assets/img/profiles/avatar-32.jpg" },
  { id: "c2", name: "Sue Allen", gender: "Female", code: "#CR6569", avatarUrl: "/restaurant-pos/src/assets/img/profiles/avatar-33.jpg" },
  { id: "c3", name: "Frank Barrett", gender: "Male", code: "#CR4824", avatarUrl: "/restaurant-pos/src/assets/img/profiles/avatar-31.jpg" },
  { id: "c4", name: "Walkin Customer", gender: "Male", code: "#CR8238" },
];

export const orderSearchResults: OrderSearchResult[] = [
  { id: "o1", orderNo: "#56998", type: "Dine In", tableNo: "3", tokenNo: "27" },
  { id: "o2", orderNo: "#57001", type: "Take Away", tokenNo: "26" },
  { id: "o3", orderNo: "#56998", type: "Dine In", tableNo: "3", tokenNo: "27" },
  { id: "o4", orderNo: "#57002", type: "Delivery", tokenNo: "25" },
];

export const kitchenSearchResults: KitchenSearchResult[] = [
  { id: "k1", name: "Andrew Brooks", ref: "#14751", tokenNo: "T#23896" },
  { id: "k2", name: "Walk in Customer", ref: "Take Away", tokenNo: "#14547" },
  { id: "k3", name: "Elijah Thompson", ref: "Take Away", tokenNo: "#98765" },
  { id: "k4", name: "Jennifer Brooks", ref: "DineIn", tokenNo: "#23896" },
];

export const notificationGroups: NotificationGroup[] = [
  {
    id: "today",
    heading: "Today",
    items: [
      {
        id: "n1",
        icon: "cooking-pot",
        variant: "secondary",
        message: (
          <>
            New order from <span className="text-dark fw-medium">Table #12</span> (3 items)
            pending.
          </>
        ),
        time: "20 Min Ago",
        actionable: true,
      },
      {
        id: "n2",
        icon: "shopping-cart",
        variant: "orange",
        message: (
          <>
            <span className="text-dark fw-medium">Order #124</span> confirmed and sent to the
            kitchen.
          </>
        ),
        time: "35 Min Ago",
        actionable: true,
      },
      {
        id: "n3",
        icon: "badge-dollar-sign",
        variant: "success",
        message: (
          <>
            <span className="text-dark fw-medium">$850</span> received via UPI for{" "}
            <span className="text-dark fw-medium">Order #124.</span>
          </>
        ),
        time: "40 Min Ago",
      },
      {
        id: "n4",
        icon: "square-pen",
        variant: "success",
        message: (
          <>
            New order has been created <span className="text-dark fw-medium">Dine</span> in for{" "}
            <span className="text-dark fw-medium">Table 1</span> total{" "}
            <span className="text-dark fw-medium">20 Items</span>
          </>
        ),
        time: "45 Min Ago",
        actions: [
          { label: "Accept", variant: "primary" },
          { label: "Decline", variant: "white" },
        ],
      },
    ],
  },
  {
    id: "yesterday",
    heading: "Yesterday",
    items: [
      {
        id: "n5",
        icon: "info",
        variant: "danger",
        message: (
          <>
            Low stock: Cheese <span className="text-dark fw-medium">(5 units left).</span>
          </>
        ),
        time: "10 Hrs Ago",
      },
      {
        id: "n6",
        icon: "calendar-fold",
        variant: "indigo",
        message: (
          <>
            Table reservation for Andrew Merkel at <span className="text-dark fw-medium">7:30 PM.</span>
          </>
        ),
        time: "40 Hrs Ago",
      },
    ],
  },
];

export const topSellingHighlight = "Most Ordered : Veggie Supreme Pizza";

export const topSellingItems: TopSellingItem[] = [
  {
    id: "t1",
    rank: 1,
    name: "Veggie Supreme Pizza",
    imageUrl: "@/restaurant-pos/src/assets/img/category/category-02.png",
    orders: 520,
    progressPercent: 100,
    color: "primary",
  },
  { id: "t2", rank: 2, name: "Chicken Taco", orders: 250, progressPercent: 85, color: "primary" },
  { id: "t3", rank: 3, name: "Grilled Chicken", orders: 175, progressPercent: 70, color: "secondary" },
  { id: "t4", rank: 4, name: "Lemon Mint Juice", orders: 160, progressPercent: 55, color: "success" },
  { id: "t5", rank: 5, name: "Chicken Taco", orders: 120, progressPercent: 35, color: "purple" },
];

export const categoryStats: CategoryStat[] = [
  { id: "cs1", label: "Take Away", icon: "shopping-bag", color: "primary", orders: 4898 },
  { id: "cs2", label: "Reservation", icon: "wine", color: "secondary", orders: 4587 },
  { id: "cs3", label: "Delivery", icon: "check-check", color: "success", orders: 3565 },
];

export const activeOrders: ActiveOrder[] = [
  {
    id: "a1",
    customerName: "Maria Gonzalez",
    avatarUrl: "/restaurant-pos/src/assets/img/profiles/avatar-32.jpg",
    type: "Dine In",
    tableNo: "3",
    status: "In Kitchen",
    statusVariant: "purple",
  },
  {
    id: "a2",
    customerName: "Andrew Fletcher",
    avatarUrl: "/restaurant-pos/src/assets/img/profiles/avatar-35.jpg",
    type: "Reservation",
    status: "Cancelled",
    statusVariant: "danger",
  },
  {
    id: "a3",
    customerName: "Morgan Evans",
    avatarUrl: "/restaurant-pos/src/assets/img/profiles/avatar-34.jpg",
    type: "Take Away",
    status: "Served",
    statusVariant: "orange",
  },
  {
    id: "a4",
    customerName: "Walk in Customer",
    type: "Dine In",
    tableNo: "3",
    status: "In Kitchen",
    statusVariant: "purple",
  },
  {
    id: "a5",
    customerName: "Walk in Customer",
    type: "Reservation",
    status: "Cancelled",
    statusVariant: "danger",
  },
];

export const salesSummary: SalesSummaryItem[] = [
  { id: "s1", label: "Total Orders", value: "6589", change: "+6%", icon: "shopping-bag", color: "indigo" },
  { id: "s2", label: "Total Sales", value: "$56589", change: "+12%", icon: "shield-check", color: "success" },
];

export const trendingMenus: TrendingMenu[] = [
  { id: "m1", name: "Grilled Chicken", imageUrl: "/restaurant-pos/src/assets/img/menu/menu-01.jpg", orders: 48, dietType: "Non Veg" },
  { id: "m2", name: "Grilled Veggie", imageUrl: "/restaurant-pos/src/assets/img/menu/menu-02.jpg", orders: 99, dietType: "Non Veg" },
  { id: "m3", name: "Chicken Noodle", imageUrl: "/restaurant-pos/src/assets/img/menu/menu-03.jpg", orders: 59, dietType: "Non Veg" },
  { id: "m4", name: "Corn Pizza", imageUrl: "/restaurant-pos/src/assets/img/menu/menu-04.jpg", orders: 69, dietType: "Veg" },
  { id: "m5", name: "Pumpkin Soup", imageUrl: "/restaurant-pos/src/assets/img/menu/menu-05.jpg", orders: 78, dietType: "Veg" },
  { id: "m6", name: "Hot Chocolate", imageUrl: "/restaurant-pos/src/assets/img/menu/menu-06.jpg", orders: 99, dietType: "Veg" },
];

export const newUserAvatars: AvatarStackItem[] = [
  { id: "u1", imageUrl: "/restaurant-pos/src/assets/img/profiles/avatar-27.jpg", alt: "user" },
  { id: "u2", imageUrl: "/restaurant-pos/src/assets/img/profiles/avatar-33.jpg", alt: "user" },
  { id: "u3", imageUrl: "/restaurant-pos/src/assets/img/profiles/avatar-35.jpg", alt: "user" },
  { id: "u4", imageUrl: "/restaurant-pos/src/assets/img/profiles/avatar-36.jpg", alt: "user" },
];

export const topUser = {
  name: "Andrew Jessica",
  avatarUrl: "/restaurant-pos/src/assets/img/profiles/avatar-05.jpg",
  grandTotal: "$800",
  totalNewUsers: "986",
  newUsersChange: "12.6%",
};

export const reservations: ReservationItem[] = [
  { id: "r1", day: "Nov 08", year: "2026", customerName: "Elijah Thoms", time: "10:45", tables: 2, guests: 2, status: "Booked", statusVariant: "success" },
  { id: "r2", day: "Nov 12", year: "2026", customerName: "Liam O'Connor", time: "10:45", tables: 4, guests: 5, status: "Booked", statusVariant: "success" },
  { id: "r3", day: "Nov 06", year: "2026", customerName: "Michael Cate", time: "10:45", tables: 8, guests: 6, status: "Booked", statusVariant: "success" },
  { id: "r4", day: "Nov 04", year: "2026", customerName: "James Smith", time: "10:45", tables: 8, guests: 5, status: "Paid", statusVariant: "purple" },
  { id: "r5", day: "Nov 02", year: "2026", customerName: "Walk in Customer", time: "10:45", tables: 2, guests: 5, status: "Cancelled", statusVariant: "danger" },
];

export const availableTables: TableAvailability[] = [
  { id: "tb1", name: "Table 01", guests: 6, imageUrl: "/restaurant-pos/src/assets/img/tables/tables-17.svg" },
  { id: "tb2", name: "Table 02", guests: 6, imageUrl: "/restaurant-pos/src/assets/img/tables/tables-18.svg" },
  { id: "tb3", name: "Table 03", guests: 1, imageUrl: "/restaurant-pos/src/assets/img/tables/tables-19.svg" },
  { id: "tb4", name: "Table 04", guests: 6, imageUrl: "/restaurant-pos/src/assets/img/tables/tables-17.svg" },
  { id: "tb5", name: "Table 05", guests: 6, imageUrl: "/restaurant-pos/src/assets/img/tables/tables-18.svg" },
  { id: "tb6", name: "Table 06", guests: 14, imageUrl: "/restaurant-pos/src/assets/img/tables/tables-19.svg" },
];

export const activityLog: ActivityLogGroup[] = [
  {
    id: "log-today",
    heading: "Today",
    items: [
      {
        id: "l1",
        icon: "cooking-pot",
        color: "primary",
        message: (
          <>
            New order from <span className="text-dark fw-medium">Table #12</span> (3 items)
          </>
        ),
        time: "20 min ago",
      },
      {
        id: "l2",
        icon: "shopping-cart",
        color: "orange",
        message: (
          <>
            New order from <span className="text-dark fw-medium">Table #12</span> (3 items)
          </>
        ),
        time: "20 min ago",
      },
      {
        id: "l3",
        icon: "badge-dollar-sign",
        color: "success",
        message: (
          <>
            New order from <span className="text-dark fw-medium">Table #12</span> (3 items)
          </>
        ),
        time: "20 min ago",
      },
    ],
  },
  {
    id: "log-yesterday",
    heading: "Yesterday",
    items: [
      {
        id: "l4",
        icon: "calendar-fold",
        color: "indigo",
        message: (
          <>
            New order from <span className="text-dark fw-medium">Table #12</span> (3 items)
          </>
        ),
        time: "40 Hrs Ago",
      },
      {
        id: "l5",
        icon: "info",
        color: "danger",
        message: (
          <>
            Low stock: Cheese <span className="text-dark fw-medium">(5 units left).</span>
          </>
        ),
        time: "40 Hrs Ago",
      },
    ],
  },
];
