# 项目架构文档

## 🏗️ 项目结构

```
├── app/                    # Next.js App Router
│   ├── (screens)/         # 页面组
│   │   ├── photo/         # 拍照页面
│   │   └── chat/          # 对话页面
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── components/            # React 组件
│   ├── ui/               # 通用 UI 组件
│   ├── home/             # 首页专用组件
│   └── microphone-button.tsx
├── hooks/                # 自定义 hooks
├── lib/                  # 工具函数和配置
│   ├── constants.ts      # 常量定义
│   ├── types.ts         # TypeScript 类型
│   └── utils.ts         # 工具函数
└── public/              # 静态资源
```

## 🔧 关键特性

### 1. 组件化架构
- **UI 组件**: 可复用的基础组件 (`PageHeader`, `PageContainer`, `LoadingSpinner`)
- **业务组件**: 特定功能组件 (`LocationDisplay`, `ProductRecognition`, `ProductList`)
- **布局组件**: 页面级布局组件

### 2. TypeScript 类型安全
- 完整的类型定义在 `lib/types.ts`
- 组件 props 类型检查
- 业务逻辑类型约束

### 3. 常量管理
- 集中式常量管理 (`lib/constants.ts`)
- 路由、样式、配置统一管理
- 易于维护和修改

### 4. 现代化路由
- Next.js App Router
- 页面级代码分割
- 静态生成优化

## 🚀 开发指南

### 添加新页面
1. 在 `app/(screens)/` 下创建新目录
2. 创建 `page.tsx` 文件
3. 使用 `PageContainer` 和 `PageHeader` 组件

### 添加新组件
1. 根据用途放入 `components/ui/` 或 `components/[feature]/`
2. 定义 TypeScript 接口
3. 添加适当的 props 验证

### 样式规范
- 使用 Tailwind CSS
- 集中管理颜色常量
- 保持一致的间距和字体

## 🐳 Docker 部署

项目已配置 Next.js 优化的 Docker 环境：

```bash
# 构建镜像
docker build -t smart-shopping-app .

# 运行容器
docker-compose up -d
```

访问地址: http://localhost:3000

## 📱 响应式设计

- 移动优先设计
- 适配多种屏幕尺寸
- 优化触摸交互

## 🔒 安全性

- TypeScript 类型检查
- 组件 props 验证
- 安全的环境变量管理