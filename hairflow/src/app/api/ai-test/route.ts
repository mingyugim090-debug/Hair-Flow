import { NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';

export async function GET() {
  try {
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 비용 효율적인 모델 사용
      messages: [{ role: "user", content: "HairFlow 서비스의 AI 연결이 성공했는지 짧게 답해줘!" }],
    });

    return NextResponse.json({
      success: true,
      message: response.choices[0].message.content
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      success: false,
      error: message
    }, { status: 500 });
  }
}