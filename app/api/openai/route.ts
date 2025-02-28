// app/api/openai/route.ts
import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL // 若使用代理需配置
});

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();

        const completion = await openai.chat.completions.create({
            model: "deepseek-reasoner", // 推荐使用最新模型
            messages: [
                {
                    role: "system",
                    content: `你是一位资深的周易解卦大师，请遵循以下规范：
                                1. 使用现代中文口语化解卦（禁用文言文）
                                2. 保持回答在20字长度内
                                3. 规避任何政治敏感内容
                                4. 格式要求：主结论+分句建议+总结预测
                                5. 使用通俗易懂的现代中文表达
                                6. 在结果中不要显示格式，直接拼接成完整的句子
`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.8,
            max_tokens: 50,
            response_format: { type: "text" } // 强制文本输出
        });

        // 处理OpenAI响应结构
        const result = completion.choices[0].message.content
            ?.trim()
            .replace(/["【】]/g, "");
        return NextResponse.json({ result });

    } catch (error: any) {
        console.error("OpenAI API Error:", error);
        return NextResponse.json(
            {
                code: error.code || "INTERNAL_ERROR",
                message: error.message || "AI服务暂时不可用"
            },
            { status: error.status || 500 }
        );
    }
}
