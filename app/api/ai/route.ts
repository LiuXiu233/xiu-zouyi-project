import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { prompt } = await req.json();

    try {
        const response = await fetch("https://key.wenwen-ai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await response.json();
        return NextResponse.json({ result: data.choices[0].message.content.trim() });
    } catch (error) {
        console.error("AI请求失败", error);
        return NextResponse.json({ error: "AI服务不可用" }, { status: 500 });
    }
}