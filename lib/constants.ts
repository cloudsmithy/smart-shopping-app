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

// 产品数据 - 按类别分组
export const SAMPLE_PRODUCTS = {
  "daily-food": [
    { name: "安全的食用油", description: "选购指南 今日在售" },
    { name: "无添加剂的深海鱼", description: "选购指南 今日在售" },
    { name: "正宗的五常大米", description: "选购指南 今日在售" },
    { name: "优质面粉", description: "选购指南 今日在售" },
    { name: "新鲜鸡蛋", description: "选购指南 今日在售" },
    { name: "纯牛奶", description: "选购指南 今日在售" },
  ],
  "snacks-drinks": [
    { name: "低糖酸奶", description: "选购指南 今日在售" },
    { name: "坚果零食", description: "选购指南 今日在售" },
    { name: "无添加果汁", description: "选购指南 今日在售" },
    { name: "全麦饼干", description: "选购指南 今日在售" },
    { name: "天然蜂蜜", description: "选购指南 今日在售" },
    { name: "功能饮料", description: "选购指南 今日在售" },
  ],
  "seasonal-ingredients": [
    { name: "时令蔬菜", description: "选购指南 今日在售" },
    { name: "应季水果", description: "选购指南 今日在售" },
    { name: "新鲜菌菇", description: "选购指南 今日在售" },
    { name: "海鲜水产", description: "选购指南 今日在售" },
    { name: "有机豆制品", description: "选购指南 今日在售" },
    { name: "冬季滋补品", description: "选购指南 今日在售" },
  ],
} as const;

// 获取所有产品的扁平化数组（向后兼容）
export const ALL_SAMPLE_PRODUCTS = Object.values(SAMPLE_PRODUCTS).flat();

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