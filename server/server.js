
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- 1. AI-Powered Manse-ryeok Calculator ---
async function getSajuPalja(birthInfo) {
    const { calendarType, year, month, day, hour, isLeapMonth } = birthInfo;

    const dateType = calendarType === 'solar' ? '양력' : '음력';
    const leapMonthText = isLeapMonth ? ' (윤달)' : '';
    const hourText = hour ? `${hour}시` : '모름';

    const prompt = `
        너는 이제부터 사주 명리학의 만세력 계산기야. 내가 주는 생년월일시를 정확한 사주팔자로 변환하여 **오직 JSON 형식으로만 응답해야 해. 다른 설명이나 추가적인 텍스트는 절대 포함하지 마.**

        **계산 규칙:**
        1. 한 해의 시작은 양력 1월 1일이 아닌 **입춘(立春)** 절입 시각이야.
        2. 한 달의 시작은 매월 1일이 아닌, **각 월의 절기(예: 경칩, 청명 등)**가 시작되는 시각이야.
        3. 시간(시주) 계산은 태어난 날의 일간(日干)을 기준으로 정확하게 계산해야 해.

        **입력 정보:**
        - 기준: ${dateType}
        - 생년월일: ${year}년 ${month}월 ${day}일${leapMonthText}
        - 태어난 시간: ${hourText}

        **출력 형식 (JSON):**
        - 예시: { "year": "甲子", "month": "丙寅", "day": "丁卯", "hour": "戊辰" }
        - 태어난 시간을 모를 경우, hour 필드는 null로 설정해줘.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json|```/g, '').trim();
        return JSON.parse(text);
    } catch (e) {
        console.error("Error parsing Saju Palja from AI:", e);
        throw new Error("AI로부터 사주팔자를 계산하는 데 실패했습니다.");
    }
}

// --- 2. AI-Powered Saju Analyst ---
async function getSajuAnalysis(sajuPalja, section, name, gender) {
    const { year, month, day, hour } = sajuPalja;

    let sajuInfo;
    if (hour) {
        sajuInfo = `이 사람의 사주팔자는 ${year}년 ${month}월 ${day}일 ${hour}시 입니다.`;
    } else {
        sajuInfo = `이 사람의 사주는 ${year}년 ${month}월 ${day}일 입니다. (태어난 시간 정보 없음)`;
    }

    const sectionPrompts = {
      basic: `**기본 성향**: 이 사주를 가진 사람의 타고난 기질, 성격, 장점과 단점을 심도 있게 분석해주세요.`,
      wealth: `**재물운**: 이 사주에 나타난 평생의 재물운 흐름과 돈을 벌기 위한 구체적인 조언을 해주세요.`,
      health: `**건강운**: 이 사주를 통해 알 수 있는 주의해야 할 건강 문제와 건강을 유지하기 위한 실용적인 팁을 알려주세요.`,
      future: `**${new Date().getFullYear()}년 운세**: 이 사주를 가진 사람의 올해 전반적인 운세와 조심해야 할 점, 그리고 기회를 잡기 위한 조언을 이야기해주세요.`,
    };

    const prompt = `
      사용자의 이름은 ${name}, 성별은 ${gender}입니다.
      ${sajuInfo}

      당신은 한국에서 가장 저명한 명리학자입니다. 위 사주 정보를 바탕으로 전문적인 사주 명리학자의 관점에서 다음 요청사항에 대해서만, 다른 내용은 절대 포함하지 말고 상세하고 명리학을 모르는 사람이 봐도 이해할 수 있게끔 친절하게 설명해주세요.

      - **오직 이 주제에 대해서만 설명하세요**: ${sectionPrompts[section]}

      **분량은 최소 5문장 이상으로, 매우 상세하고 풍부하게 설명해야 합니다.**
      결과는 마크다운 형식을 사용해서 핵심적인 부분은 굵게 표시해주세요. 
      이모지를 적절히 사용하여 내용을 더 친근하게 만들어주세요.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

// --- Main API Endpoint ---
app.post('/api/get-saju', async (req, res) => {
  try {
    const { name, gender, calendarType, year, month, day, hour, isLeapMonth, section } = req.body;

    if (!name || !gender || !calendarType || !year || !month || !day || !section) {
      return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
    }

    // Step 1: Get Saju Palja from AI Calculator
    const sajuPalja = await getSajuPalja({ calendarType, year, month, day, hour, isLeapMonth });

    // Step 2: Get Saju Analysis from AI Analyst
    const analysisResult = await getSajuAnalysis(sajuPalja, section, name, gender);

    res.json({ sajuResult: analysisResult });

  } catch (error) {
    console.error('Error processing Saju request:', error);
    res.status(500).json({ error: error.message || '사주 분석 중 오류가 발생했습니다.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
