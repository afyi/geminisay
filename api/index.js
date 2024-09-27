/*!
 * Gsay vercel function
 * author: alex <xux85@msn.com>
 * Released under the MIT License.
 * 
 * Usage:
 * 
 *  buid a pgsql schema
 * 
 * -- ----------------------------
 * -- Table structure for ai
 * -- ----------------------------
 * DROP TABLE IF EXISTS "public"."ai";
 * CREATE TABLE "public"."ai" (
 *   "id" int4 NOT NULL DEFAULT nextval('ai_id_seq'::regclass),
 *   "slug" varchar(255) COLLATE "pg_catalog"."default",
 *   "content" text COLLATE "pg_catalog"."default" DEFAULT ''::text,
 *   "status" int2 DEFAULT 1,
 *   "created" timestamptz(3) DEFAULT now()
 * );
 * -- ----------------------------
 * -- Primary Key structure for table ai
 * -- ----------------------------
 * ALTER TABLE "public"."ai" ADD CONSTRAINT "ai_pkey" PRIMARY KEY ("id");
 * 
 */

module.exports = async (request, response) => {
  // 拿到全局常量
  const { ORIGIN, SUPABASE_URL, SUPABASE_KEY, GEMINIKEY, GEMINIMODEL } = process.env;
  // 指定请求来源
  response.setHeader('Access-Control-Allow-Origin', ORIGIN || '*');
  // 指定方法
  response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
  // 指定请求头中的字段
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // 处理预检请求
  if (request.method === 'OPTIONS') {
    // 预检请求的结果可以被缓存 1 小时
    response.setHeader('Access-Control-Max-Age', '3600');
    // 抛出状态码 204
    return response.status(204).end();
  }
  // 判定参数是否正常
  if (SUPABASE_URL == '' || SUPABASE_KEY == '') {
    return response.json({ error: '环境配置不正确，请阅读文档配置对应的环境变量' }).status(403);
  }
  // 读取传送来slug
  const { slug } = await request.body || {};
  // 监听
  console.info("当前slug:", slug);
  // 如果没参数，直接403
  if (!/\w+\/\w+/.test(slug)) return response.json({ error: '文章slug错误' }).status(403);
  // 引入 Supabase 客户端
  const { createClient } = require('@supabase/supabase-js'); 
  // 如果有参数，则去连接数据库拿
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  // 如果连接错误，抛出错误 
  if (!supabase) {
    // 控制台返回
    console.error("数据库连接错误");
    // 抛出状态码 500
    return response.json({ error: '数据库有点小抽风哦，请稍后重试...' }).status(500);
  }
  // 从数据库拿数据
  let { data, error } = await supabase.from('ai').select('*').eq('slug', slug).limit(1);
  // 控制台监听
  console.log("从数据库获取的数据:", data);
  // 如果连接出现错误
  if (error) {
    // 控制台监听
    console.error('从数据库获取数据失败:', error);
    // 前台抛出
    return response.json({ error: '数据库累倒了,请稍候再试...' }).status(500);
  }
  // 数据不存在，就从去远程拿
  if (data.length === 0) {
    // 判定是否有配置的 GeminiKEY
    if (GEMINIKEY == '') {
      console.error("未配置 GeminiKEY，请检查当前环境中否有 GeminiKEY");
      return response.json({ error: 'GEMINI配置不正确，请阅读文档配置对应的环境变量' }).status(403);
    }
    // 获取来源页
    const referrer = req.headers['referer'] || req.headers['referrer'];
    // 如果来源页为空
    if (!referrer) {
      // 控制台监听
      console.error('没有找到来源页，无法继续');
      // 前台抛出
      return response.json({ error: '没有找到来源页，无法继续' }).status(403);
    }
    // 读取传送来slug
    const { contid } = await request.body || {};
    // 如果没参数，直接403
    if (!contid) return response.json({ error: '文章内容id错误' }).status(403);
    // 然后这里去抓取页面，之前是用简单的拼凑字条串，现在去页面拿
    const delResp = await fetch(referrer);
    // 如果响应状态码不正常，就抛出错误
    if (!delResp.ok) return response.json({ error: '您指定的博客文章不存在哦...' }).status(403);
    // 要提取的内容
    const regex = new RegExp(`<div.*?id="${contid}">(.*?)<\/div>`, 's');
    // 获取当前文章内容并且过滤掉html，只留纯文本，防止超出，最多255个字
    const content = await delResp.text().then(text => text.match(regex)[1].replace(/[\r\n]+/g, '').replace(/<[^>]*>/g, '').replace(/[\s\t\"\']+/g, ''));
    // 监听
    console.log("当前内容提取到的内容：", content);
    // 如果文章中不包含指定的标签的内容
    if (!content) return response.json({ error: '未读到文章内容...' }).status(403);
    // 去远程拿数据
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1/models/${GEMINIMODEL || 'gemini-1.5-flash'}:generateContent?key=${GEMINIKEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: `{"contents":[{"parts":[{"text": "我写了一篇博客文章,内容是'${content}'，作为博客的日常博友,现要你根据日志内容写一段不超过160个汉字的评论,不用太正式,随意一点，当然最好用萌一点可爱一点的口语，称呼我叫博主就可以了，谢谢"}]}]}`,
    });
    if (!resp.ok) {
      console.error("当前请求失败：", resp)
      return response.json({ error: 'Gemini娘自闭中，请稍后再试...' }).status(500);
    }
    const result = await resp.json();
    if (result.error || !result.candidates[0].content) {
      console.error("API接口错误，请检查接口...");
      return response.json({ error: 'Gemini娘累了需要休息会，稍候再试...' }).status(500);
    };
    // 拼凑出t串
    data = [{
      slug: slug,
      content: result.candidates[0].content.parts[0].text || '',
    }];
    // 然后写入本地数据库
    const { error } = await supabase.from('ai').insert(data);
    // 这里写入失败，其实可以不抛出错误，因为这次没拿到，下次还会去拿，所以后台记录一下即可
    if (error) console.error('数据写入错误:', error);
  }
  // 输出数据
  return response.json({ "say": data[0].content, "updated": data[0].created }).status(200);
}