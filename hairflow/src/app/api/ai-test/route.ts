import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 비용 효율적인 모델 사용
      messages: [{ role: "user", content: "HairFlow 서비스의 AI 연결이 성공했는지 짧게 답해줘!" }],
    });

    return NextResponse.json({ 
      success: true, 
      message: response.choices[0].message.content 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}