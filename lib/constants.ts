// 应用配置常量
export const APP_CONFIG = {
  name: "智能购物助手",
  version: "1.0.0",
  defaultLocation: "上海市黄浦区马当路富民超市",
} as const;

// 下拉菜单数据
export const SUPERMARKET_OPTIONS = [
  { value: "shanghaip-madang", label: "上海市黄浦区马当路富民超市" },
  { value: "shanghai-xizang", label: "上海市黄浦区西藏中路盒马超市" },
  { value: "shanghai-songhu", label: "上海市杨浦区淞沪路小象超市" },
] as const;

export const PRODUCT_CATEGORY_OPTIONS = [
  { value: "daily-food", label: "日用食品" },
  { value: "snacks-drinks", label: "零食饮料" },
  { value: "seasonal-ingredients", label: "时令食材" },
] as const;

// 样式常量
export const COLORS = {
  primary: "#07c160",
  primaryHover: "#059c4a", 
  black: "#000000",
  gray: "#979797",
  lightGray: "#f2f2f2",
  background: "#ffffff",
  cardBackground: "#f5f5f5",
} as const;

// 产品数据
export const SAMPLE_PRODUCTS = [
  { name: "安全的食用油", description: "选购指南 今日在售" },
  { name: "无添加剂的深海鱼", description: "选购指南 今日在售" },
  { name: "正宗的五常大米", description: "选购指南 今日在售" },
];

// 路由常量
export const ROUTES = {
  home: "/",
  photo: "/photo", 
  chat: "/chat",
} as const;

// AI助手功能
export const AI_FEATURES = [
  "食物对比",
  "全网比价", 
  "卡路里计算",
] as const;