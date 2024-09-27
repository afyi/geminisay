## gsay-vercel
一个基于gemini api的博客文件评论小工具

## 当前版本
1.0.1

## 食用方法 

### 1. 申请一个[Supabase](https://supabase.com)帐号，建立一个数据库
运行以下SQL,在数据库中创建一个名为`ai`的表
```sql
-- ----------------------------
-- Table structure for ai
-- ----------------------------
DROP TABLE IF EXISTS "public"."ai";
CREATE TABLE "public"."ai" (
  "id" int4 NOT NULL DEFAULT nextval('ai_id_seq'::regclass),
  "slug" varchar(255) COLLATE "pg_catalog"."default",
  "content" text COLLATE "pg_catalog"."default" DEFAULT ''::text,
  "status" int2 DEFAULT 1,
  "created" timestamptz(3) DEFAULT now()
);
-- ----------------------------
-- Primary Key structure for table ai
-- ----------------------------
ALTER TABLE "public"."ai" ADD CONSTRAINT "ai_pkey" PRIMARY KEY ("id");
```

### 2. 配置环境变量
|变量名称|变量说明|默认值|
|-|-|-|
|ORIGIN|CORS头的ORIGIN值|*|
|SUPABASE_URL|supabase的服务器url|-|
|SUPABASE_KEY|supabase的KEY|-|
|GEMINI_API_KEY|gemini的api key|-|
|GEMINIMODEL|gemini的模型值|gemini-1.5-flash|

### 3. fork项目，然后在vercel中部署你刚fork的项目

### 4. 在你的博客页面中引入gsay.js文件，并调用gsay.init方法

建议下载，因为gihub的速度，你懂得....

<未完待续>
