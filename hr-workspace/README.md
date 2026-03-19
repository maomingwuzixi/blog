# 吴梓锡的 HR 工作台

> 一个专为 HR 设计的个人工作管理系统，集成日程、待办、面试、台账、表单自动化等功能。

🔗 **在线访问**: https://blog.1297035851.top

## ✨ 功能特性

### 📊 工作台概览
- 实时数据统计（员工数、面试数、待办数、合同到期提醒）
- 今日日程时间线
- 快捷操作入口

### 📅 日程安排
- 月历视图，直观查看每日安排
- 支持会议、面试、培训等多种类型
- 点击日期快速添加日程

### ✅ 待办事项
- 优先级管理（高/中/低）
- 完成状态切换
- 按状态和优先级筛选

### 🎤 招聘管理
- **面试安排**: 候选人、时间、面试官、状态管理
- **候选人库**: 来源渠道、当前状态跟踪

### 📝 人事台账
- **员工台账**: 工号、部门、职位、入职日期、状态
- **合同台账**: 合同期限、到期提醒（30天内高亮）

### 📋 表单自动化
- 入职登记表
- 离职交接表
- 考勤汇总表
- Offer 录用函
- 工资条
- 绩效评估表

### 📁 资源管理
- 文件上传与管理
- 信息发布与公告

## 🚀 部署指南

### 方式一：GitHub Pages + 自定义域名

1. **创建 GitHub 仓库**
   ```bash
   # 仓库地址: https://github.com/maomingwuzixi/blog
   ```

2. **上传代码**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/maomingwuzixi/blog.git
   git push -u origin main
   ```

3. **配置 GitHub Pages**
   - 进入仓库 Settings → Pages
   - Source 选择 "Deploy from a branch"
   - Branch 选择 "main" / "root"
   - 保存

4. **绑定自定义域名**
   - 在 Pages 设置中找到 "Custom domain"
   - 输入: `blog.1297035851.top`
   - 保存（会自动验证并生成 SSL 证书）
   - 确保仓库根目录有 `CNAME` 文件（已包含）

5. **DNS 配置**（在你的域名服务商处）
   - 添加 CNAME 记录:
     - 主机记录: `blog`
     - 记录值: `maomingwuzixi.github.io`
   - 或添加 A 记录指向 GitHub Pages IP:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`

### 方式二：本地使用

直接用浏览器打开 `index.html` 即可，所有数据存储在浏览器本地存储中。

## 🗄️ Supabase 数据库配置

### 已配置的连接信息
```javascript
URL: https://wahhfssjvhuwdugctwnb.supabase.co
KEY: sb_publishable_Us3O7cL4cMo03f8kXDeubg_WxFETihT
```

### 需要创建的表

在 Supabase 控制台中执行以下 SQL：

```sql
-- 员工表
CREATE TABLE employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    dept TEXT,
    position TEXT,
    hire_date DATE,
    status TEXT DEFAULT '试用期'
);

-- 候选人表
CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    position TEXT,
    source TEXT,
    status TEXT DEFAULT '待筛选',
    created_at DATE DEFAULT CURRENT_DATE
);

-- 面试表
CREATE TABLE interviews (
    id SERIAL PRIMARY KEY,
    candidate_name TEXT,
    position TEXT,
    time TEXT,
    interviewer TEXT,
    status TEXT DEFAULT '待进行'
);

-- 日程表
CREATE TABLE schedules (
    id SERIAL PRIMARY KEY,
    title TEXT,
    date DATE,
    time TEXT,
    type TEXT
);

-- 待办表
CREATE TABLE todos (
    id SERIAL PRIMARY KEY,
    title TEXT,
    priority TEXT,
    deadline DATE,
    completed BOOLEAN DEFAULT FALSE
);

-- 合同表
CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    employee_name TEXT,
    type TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT '有效'
);

-- 文件表
CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    name TEXT,
    type TEXT,
    size TEXT,
    date DATE,
    desc TEXT
);

-- 公告表
CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    title TEXT,
    content TEXT,
    author TEXT,
    date DATE
);
```

### 启用 Row Level Security (RLS)

```sql
-- 为每个表启用 RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
-- ... 其他表

-- 创建允许所有操作的策略（开发阶段）
CREATE POLICY "Allow all" ON employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON candidates FOR ALL USING (true) WITH CHECK (true);
-- ... 其他表
```

## 📁 项目结构

```
hr-workspace/
├── index.html          # 主页面
├── CNAME               # 自定义域名配置
├── README.md           # 项目说明
├── css/
│   └── style.css       # 样式文件
├── js/
│   ├── supabase-config.js  # Supabase 配置
│   └── app.js              # 主应用逻辑
└── pages/              # （预留）子页面
```

## 🔧 技术栈

- **前端**: 纯 HTML5 + CSS3 + JavaScript (ES6+)
- **UI**: 自定义 CSS，专业商务风格
- **数据库**: Supabase (PostgreSQL)
- **存储**: LocalStorage (离线备用) + Supabase (云端同步)
- **部署**: GitHub Pages

## 💡 使用技巧

1. **离线可用**: 所有数据先存本地，联网后自动同步到 Supabase
2. **快捷操作**: 点击右上角 ⚡ 按钮快速创建事项
3. **合同提醒**: 30天内到期的合同会自动高亮显示
4. **表单生成**: 在"表单自动化"页面一键生成各类 HR 表单

## 📝 更新日志

### v1.0 (2026-03-19)
- 初始版本发布
- 完成工作台、日程、待办、面试、台账、表单、文件、公告等核心功能
- 集成 Supabase 数据库
- 支持 GitHub Pages 部署

## 📧 联系方式

- 作者: 吴梓锡
- 域名: blog.1297035851.top
- 仓库: https://github.com/maomingwuzixi/blog

---

Made with ❤️ for HR professionals
