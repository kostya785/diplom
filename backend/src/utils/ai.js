import crypto from "crypto";

const SERVICES_LIST = `
- Терапия: Первичный приём терапевта, Повторный приём терапевта
- Кардиология: Консультация кардиолога, ЭКГ с расшифровкой, Эхокардиография
- Неврология: Консультация невролога, ЭЭГ
- Гинекология: Консультация гинеколога, УЗИ малого таза, Взятие мазка
- Хирургия: Консультация хирурга, Обработка раны, Удаление новообразования
- Педиатрия: Консультация педиатра, Вакцинация
- Дерматология: Консультация дерматолога, Дерматоскопия
- Офтальмология: Консультация офтальмолога, Подбор очков
- ЛОР: Консультация ЛОРа, Промывание носа
- Урология: Консультация уролога, УЗИ предстательной железы
- Эндокринология: Консультация эндокринолога, УЗИ щитовидной железы
- Травматология: Консультация травматолога
- Психиатрия: Консультация психотерапевта
- Гастроэнтерология: Консультация гастроэнтеролога, ФГДС
- Аллергология: Консультация аллерголога, Аллергопробы
- Наркология: Консультация нарколога, Детоксикация
- Диагностика: Рентген, МРТ, КТ, Общий анализ крови, Биохимический анализ крови, Общий анализ мочи
`;

const DOCTORS_LIST = `
- Иванов Алексей Петрович — Терапевт
- Петрова Мария Сергеевна — Кардиолог
- Сидоров Дмитрий Иванович — Невролог
- Козлова Елена Викторовна — Гинеколог
- Морозов Андрей Николаевич — Хирург
- Васильев Сергей Николаевич — Педиатр
- Николаева Ольга Александровна — Дерматолог
- Фёдоров Игорь Викторович — Офтальмолог
- Смирнова Анна Петровна — ЛОР
- Кузнецов Дмитрий Александрович — Уролог
- Попова Елена Сергеевна — Эндокринолог
- Волков Артём Игоревич — Травматолог-ортопед
- Соколова Мария Ивановна — Психотерапевт
- Лебедев Константин Павлович — Гастроэнтеролог
- Орлова Наталья Викторовна — Аллерголог-иммунолог
- Козлов Максим Андреевич — Нарколог
`;


const FALLBACK_RULES = [
  {
    pattern: /ребен|ребён|ребенк|ребёнк|дочк|сынок|сына |малыш|дитя|новорожд|грудничк|прививк|вакцин/,
    service: "Консультация педиатра",
    category: "Педиатрия",
    doctor: "Васильев Сергей Николаевич",
    specialty: "Педиатр",
    reason: "Жалобы касаются здоровья ребёнка"
  },
  {
    pattern: /сердц|давлен|аритм|тахикард|груд[ьи]?\s*болит|экг|пульс/,
    service: "Консультация кардиолога",
    category: "Кардиология",
    doctor: "Петрова Мария Сергеевна",
    specialty: "Кардиолог",
    reason: "Жалобы связаны с сердечно-сосудистой системой"
  },
  {
    pattern: /голов[а-я]*\s*болит|мигрен|головокруж|онемен|немеет|нерв|спин[а-я]*\s*болит|шея|шею|позвон|радикулит/,
    service: "Консультация невролога",
    category: "Неврология",
    doctor: "Сидоров Дмитрий Иванович",
    specialty: "Невролог",
    reason: "Жалобы указывают на возможные неврологические проблемы"
  },
  {
    pattern: /гинек|беремен|менстру|матк|яичник|выделен|цикл наруш/,
    service: "Консультация гинеколога",
    category: "Гинекология",
    doctor: "Козлова Елена Викторовна",
    specialty: "Гинеколог",
    reason: "Жалобы связаны с женским здоровьем"
  },
  {
    pattern: /перелом|вывих|растян|ушиб|сустав|позвоночник.*травм|травм[а-я]*/,
    service: "Консультация травматолога",
    category: "Травматология",
    doctor: "Волков Артём Игоревич",
    specialty: "Травматолог-ортопед",
    reason: "Похоже на травму или проблему с опорно-двигательным аппаратом"
  },
  {
    pattern: /операц|рана\b|шов|швы|грыж|хирург|порез|нарыв|гноит/,
    service: "Консультация хирурга",
    category: "Хирургия",
    doctor: "Морозов Андрей Николаевич",
    specialty: "Хирург",
    reason: "Может потребоваться хирургическая консультация"
  },
  {
    pattern: /кожа|кожи|сыпь|прыщ|родинк|дерматит|экзем|псориаз|шелушит|зуд кожи/,
    service: "Консультация дерматолога",
    category: "Дерматология",
    doctor: "Николаева Ольга Александровна",
    specialty: "Дерматолог",
    reason: "Жалобы связаны с состоянием кожи"
  },
  {
    pattern: /глаз|зрени|видит плохо|видно плохо|очки|линз[аы]/,
    service: "Консультация офтальмолога",
    category: "Офтальмология",
    doctor: "Фёдоров Игорь Викторович",
    specialty: "Офтальмолог",
    reason: "Жалобы связаны со зрением"
  },
  {
    pattern: /горло|нос заложен|насморк|гайморит|ангина|отит|ухо болит|уши болят|заложенность носа/,
    service: "Консультация ЛОРа",
    category: "ЛОР",
    doctor: "Смирнова Анна Петровна",
    specialty: "ЛОР",
    reason: "Жалобы касаются уха, горла или носа"
  },
  {
    pattern: /мочеиспуск|простат|мочев[а-я]* пузыр|половых органов|потенц/,
    service: "Консультация уролога",
    category: "Урология",
    doctor: "Кузнецов Дмитрий Александрович",
    specialty: "Уролог",
    reason: "Жалобы связаны с мочеполовой системой"
  },
  {
    pattern: /щитовидк|диабет|сахар в крови|гормон|лишний вес|похудел резко|жажда постоянная/,
    service: "Консультация эндокринолога",
    category: "Эндокринология",
    doctor: "Попова Елена Сергеевна",
    specialty: "Эндокринолог",
    reason: "Жалобы могут быть связаны с гормональными нарушениями"
  },
  {
    pattern: /тревог|депресс|паническ|панич[а-я]*\s*атак|стресс|бессонниц|апати/,
    service: "Консультация психотерапевта",
    category: "Психиатрия",
    doctor: "Соколова Мария Ивановна",
    specialty: "Психотерапевт",
    reason: "Жалобы касаются психоэмоционального состояния"
  },
  {
    pattern: /желудок|живот болит|изжог|тошнот|рвот|понос|диаре|запор|кишечник|гастрит/,
    service: "Консультация гастроэнтеролога",
    category: "Гастроэнтерология",
    doctor: "Лебедев Константин Павлович",
    specialty: "Гастроэнтеролог",
    reason: "Жалобы связаны с работой желудочно-кишечного тракта"
  },
  {
    pattern: /аллерг|крапивниц|отек квинке|отёк квинке|чихан[а-я]* на/,
    service: "Консультация аллерголога",
    category: "Аллергология",
    doctor: "Орлова Наталья Викторовна",
    specialty: "Аллерголог-иммунолог",
    reason: "Жалобы похожи на аллергическую реакцию"
  },
  {
    pattern: /алкогол|запой|наркотик|зависимост/,
    service: "Консультация нарколога",
    category: "Наркология",
    doctor: "Козлов Максим Андреевич",
    specialty: "Нарколог",
    reason: "Жалобы касаются вопросов зависимости"
  },
  {
    pattern: /анализ|кров[и]?\s*сдать|лабор|биохим/,
    service: "Общий анализ крови",
    category: "Диагностика",
    doctor: "Иванов Алексей Петрович",
    specialty: "Терапевт",
    reason: "Для начала рекомендуется лабораторная диагностика"
  }
];

function fallbackRecommend(complaints, patientInfo = {}) {
  const text = complaints.toLowerCase();
  const suggestions = [];


  if (typeof patientInfo.age === "number" && patientInfo.age < 18) {
    suggestions.push({
      service: "Консультация педиатра",
      category: "Педиатрия",
      doctor: "Васильев Сергей Николаевич",
      specialty: "Педиатр",
      reason: "Пациент младше 18 лет"
    });
  }

  for (const rule of FALLBACK_RULES) {
    if (rule.pattern.test(text) && !suggestions.some((s) => s.specialty === rule.specialty)) {
      suggestions.push({
        service: rule.service,
        category: rule.category,
        doctor: rule.doctor,
        specialty: rule.specialty,
        reason: rule.reason
      });
    }
    if (suggestions.length >= 3) break;
  }

  if (suggestions.length === 0) {
    suggestions.push({
      service: "Первичный приём терапевта",
      category: "Терапия",
      doctor: "Иванов Алексей Петрович",
      specialty: "Терапевт",
      reason: "При неясных жалобах рекомендуется начать с консультации терапевта"
    });
  }

  return {
    reply: `На основе ваших жалоб я подобрал подходящие варианты. Рекомендую начать с: ${suggestions[0].service} (${suggestions[0].doctor}). Это не заменяет очную консультацию врача.`,
    suggestions: suggestions.slice(0, 3)
  };
}

function buildPrompts(complaints, patientInfo) {
  const systemPrompt = `Ты — медицинский помощник клиники «Константинополь Мед». Помогаешь пациентам выбрать врача и услугу по жалобам.
НЕ ставь диагнозы. Рекомендуй обратиться к врачу. Отвечай на русском языке.
Доступные услуги:${SERVICES_LIST}
Доступные врачи:${DOCTORS_LIST}
Отвечай СТРОГО в формате JSON без markdown-обёртки (без \`\`\`), без пояснений до или после:
{"reply": "текст ответа пациенту", "suggestions": [{"service": "название услуги", "category": "категория", "doctor": "ФИО врача", "specialty": "специальность", "reason": "почему"}]}
Максимум 3 suggestions.`;

  const userMessage = `Пациент: пол ${
    patientInfo.gender === "MALE" ? "мужской" : patientInfo.gender === "FEMALE" ? "женский" : "не указан"
  }, возраст: ${patientInfo.age ?? "не указан"}.
Жалобы: ${complaints}`;

  return { systemPrompt, userMessage };
}

async function callYandexGPT(complaints, patientInfo) {
  const apiKey = process.env.YANDEX_API_KEY;
  const folderId = process.env.YANDEX_FOLDER_ID;

  if (!apiKey || !folderId) {
    console.error("YandexGPT: не заданы YANDEX_API_KEY / YANDEX_FOLDER_ID");
    return null;
  }

  const { systemPrompt, userMessage } = buildPrompts(complaints, patientInfo);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let response;
  try {
    response = await fetch(
      "https://llm.api.cloud.yandex.net/foundationModels/v1/completion",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Api-Key ${apiKey}`,
          "x-folder-id": folderId
        },
        body: JSON.stringify({
          modelUri: `gpt://${folderId}/yandexgpt-lite/latest`,
          completionOptions: {
            stream: false,
            temperature: 0.3,
            maxTokens: 1000
          },
          messages: [
            { role: "system", text: systemPrompt },
            { role: "user", text: userMessage }
          ]
        }),
        signal: controller.signal
      }
    );
  } catch (err) {
    console.error("YandexGPT request error:", err.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    console.error("YandexGPT error:", response.status, await response.text());
    return null;
  }

  const data = await response.json();
  const text = data.result?.alternatives?.[0]?.message?.text;
  if (!text) return null;

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("YandexGPT: не удалось найти JSON в ответе:", text);
    return null;
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("YandexGPT: невалидный JSON:", err.message, jsonMatch[0]);
    return null;
  }
}

export async function getAIRecommendation(complaints, patientInfo) {
  try {
    const aiResult = await callYandexGPT(complaints, patientInfo);
    if (aiResult?.reply && Array.isArray(aiResult.suggestions)) {
      return { ...aiResult, source: "yandexgpt" };
    }
  } catch (err) {
    console.error("YandexGPT error:", err);
  }

  return { ...fallbackRecommend(complaints, patientInfo), source: "fallback" };
}

export function generateTelegramLinkToken() {
  return crypto.randomBytes(16).toString("hex");
}