import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DOCTORS = [
  {
    email: "ivanov@clinic.ru",
    name: "Иванов Алексей Петрович",
    specialty: "Терапевт",
    description: "Врач-терапевт высшей категории. Стаж 18 лет. Специализируется на диагностике и лечении заболеваний внутренних органов.",
    services: ["Первичный приём терапевта", "Повторный приём терапевта", "Общий анализ крови", "Биохимический анализ крови", "Общий анализ мочи"]
  },
  {
    email: "petrova@clinic.ru",
    name: "Петрова Мария Сергеевна",
    specialty: "Кардиолог",
    description: "Кардиолог, кандидат медицинских наук. Проводит ЭКГ, эхокардиографию, лечение гипертонии и аритмий.",
    services: ["Консультация кардиолога", "ЭКГ с расшифровкой", "Эхокардиография"]
  },
  {
    email: "sidorov@clinic.ru",
    name: "Сидоров Дмитрий Иванович",
    specialty: "Невролог",
    description: "Невролог с 12-летним стажем. Лечение головных болей, мигреней, остеохондроза, невралгий.",
    services: ["Консультация невролога", "ЭЭГ"]
  },
  {
    email: "kozlova@clinic.ru",
    name: "Козлова Елена Викторовна",
    specialty: "Гинеколог",
    description: "Врач-гинеколог. Ведение беременности, профилактические осмотры, УЗИ малого таза.",
    services: ["Консультация гинеколога", "УЗИ малого таза", "Взятие мазка"]
  },
  {
    email: "morozov@clinic.ru",
    name: "Морозов Андрей Николаевич",
    specialty: "Хирург",
    description: "Хирург общей практики. Малые операции, лечение ран, консультации по хирургическим вопросам.",
    services: ["Консультация хирурга", "Обработка раны", "Удаление новообразования"]
  },
  {
    email: "vasiliev@clinic.ru",
    name: "Васильев Сергей Николаевич",
    specialty: "Педиатр",
    description: "Врач-педиатр с 15-летним стажем. Наблюдение детей от 0 до 18 лет, вакцинация, лечение детских заболеваний.",
    services: ["Консультация педиатра", "Вакцинация"]
  },
  {
    email: "nikolaeva@clinic.ru",
    name: "Николаева Ольга Александровна",
    specialty: "Дерматолог",
    description: "Дерматолог-венеролог. Диагностика и лечение кожных заболеваний, удаление новообразований.",
    services: ["Консультация дерматолога", "Дерматоскопия"]
  },
  {
    email: "fedorov@clinic.ru",
    name: "Фёдоров Игорь Викторович",
    specialty: "Офтальмолог",
    description: "Офтальмолог. Проверка зрения, лечение глазных заболеваний, подбор очков и контактных линз.",
    services: ["Консультация офтальмолога", "Подбор очков"]
  },
  {
    email: "smirnova@clinic.ru",
    name: "Смирнова Анна Петровна",
    specialty: "ЛОР",
    description: "ЛОР-врач. Лечение заболеваний уха, горла, носа, промывание носовых пазух.",
    services: ["Консультация ЛОРа", "Промывание носа"]
  },
  {
    email: "kuznetsov@clinic.ru",
    name: "Кузнецов Дмитрий Александрович",
    specialty: "Уролог",
    description: "Уролог-андролог. Диагностика и лечение заболеваний мочеполовой системы у мужчин.",
    services: ["Консультация уролога", "УЗИ предстательной железы"]
  },
  {
    email: "popova@clinic.ru",
    name: "Попова Елена Сергеевна",
    specialty: "Эндокринолог",
    description: "Эндокринолог. Лечение заболеваний щитовидной железы, диабета, гормональных нарушений.",
    services: ["Консультация эндокринолога", "УЗИ щитовидной железы"]
  },
  {
    email: "volkov@clinic.ru",
    name: "Волков Артём Игоревич",
    specialty: "Травматолог-ортопед",
    description: "Травматолог-ортопед. Лечение переломов, вывихов, заболеваний суставов и позвоночника.",
    services: ["Консультация травматолога", "Рентген"]
  },
  {
    email: "sokolova@clinic.ru",
    name: "Соколова Мария Ивановна",
    specialty: "Психотерапевт",
    description: "Психотерапевт. Консультации по психическим расстройствам, депрессиям, тревожным состояниям.",
    services: ["Консультация психотерапевта"]
  },
  {
    email: "lebedev@clinic.ru",
    name: "Лебедев Константин Павлович",
    specialty: "Гастроэнтеролог",
    description: "Гастроэнтеролог. Диагностика и лечение заболеваний желудочно-кишечного тракта.",
    services: ["Консультация гастроэнтеролога", "ФГДС"]
  },
  {
    email: "orlova@clinic.ru",
    name: " Орлова Наталья Викторовна",
    specialty: "Аллерголог-иммунолог",
    description: "Аллерголог-иммунолог. Диагностика аллергий, иммунодефицитов, проведение аллергопроб.",
    services: ["Консультация аллерголога", "Аллергопробы"]
  },
  {
    email: "kozlov@clinic.ru",
    name: "Козлов Максим Андреевич",
    specialty: "Нарколог",
    description: "Нарколог. Лечение алкогольной и наркотической зависимости, детоксикация.",
    services: ["Консультация нарколога", "Детоксикация"]
  }
];

const SERVICES = [
  {
    name: "Первичный приём терапевта",
    price: 2500,
    category: "Терапия",
    description: "Осмотр, сбор анамнеза, назначение обследований и лечения."
  },
  {
    name: "Повторный приём терапевта",
    price: 1800,
    category: "Терапия",
    description: "Контрольный осмотр, коррекция лечения."
  },
  {
    name: "Консультация кардиолога",
    price: 3500,
    category: "Кардиология",
    description: "Диагностика сердечно-сосудистых заболеваний, интерпретация ЭКГ."
  },
  {
    name: "ЭКГ с расшифровкой",
    price: 1500,
    category: "Кардиология",
    description: "Электрокардиография с описанием результатов врачом-кардиологом."
  },
  {
    name: "Эхокардиография",
    price: 3500,
    category: "Кардиология",
    description: "УЗИ сердца с оценкой структуры и функции."
  },
  {
    name: "Консультация невролога",
    price: 3200,
    category: "Неврология",
    description: "Диагностика и лечение заболеваний нервной системы."
  },
  {
    name: "ЭЭГ",
    price: 2500,
    category: "Неврология",
    description: "Электроэнцефалография головного мозга."
  },
  {
    name: "Консультация гинеколога",
    price: 3000,
    category: "Гинекология",
    description: "Профилактический осмотр, консультация по вопросам женского здоровья."
  },
  {
    name: "УЗИ малого таза",
    price: 2800,
    category: "Гинекология",
    description: "Ультразвуковое исследование органов малого таза."
  },
  {
    name: "Взятие мазка",
    price: 800,
    category: "Гинекология",
    description: "Гинекологический мазок на флору и цитологию."
  },
  {
    name: "Консультация хирурга",
    price: 2800,
    category: "Хирургия",
    description: "Осмотр, определение показаний к оперативному лечению."
  },
  {
    name: "Обработка раны",
    price: 1200,
    category: "Хирургия",
    description: "Первичная хирургическая обработка раны, наложение швов."
  },
  {
    name: "Удаление новообразования",
    price: 3500,
    category: "Хирургия",
    description: "Удаление папиллом, бородавок, липом под местной анестезией."
  },
  {
    name: "Консультация педиатра",
    price: 2500,
    category: "Педиатрия",
    description: "Осмотр ребёнка, консультация по развитию и здоровью."
  },
  {
    name: "Вакцинация",
    price: 1500,
    category: "Педиатрия",
    description: "Вакцинация по календарю прививок."
  },
  {
    name: "Консультация дерматолога",
    price: 2800,
    category: "Дерматология",
    description: "Осмотр кожи, диагностика кожных заболеваний."
  },
  {
    name: "Дерматоскопия",
    price: 2000,
    category: "Дерматология",
    description: "Исследование новообразований кожи с помощью дерматоскопа."
  },
  {
    name: "Консультация офтальмолога",
    price: 3000,
    category: "Офтальмология",
    description: "Проверка зрения, осмотр глазного дна."
  },
  {
    name: "Подбор очков",
    price: 1500,
    category: "Офтальмология",
    description: "Подбор корригирующих очков для зрения."
  },
  {
    name: "Консультация ЛОРа",
    price: 2500,
    category: "ЛОР",
    description: "Осмотр уха, горла, носа, консультация."
  },
  {
    name: "Промывание носа",
    price: 1200,
    category: "ЛОР",
    description: "Промывание носовых пазух по Проетцу."
  },
  {
    name: "Консультация уролога",
    price: 3200,
    category: "Урология",
    description: "Осмотр, консультация по мужскому здоровью."
  },
  {
    name: "УЗИ предстательной железы",
    price: 2500,
    category: "Урология",
    description: "Трансректальное УЗИ простаты."
  },
  {
    name: "Консультация эндокринолога",
    price: 3000,
    category: "Эндокринология",
    description: "Консультация по гормональным нарушениям, щитовидной железе."
  },
  {
    name: "УЗИ щитовидной железы",
    price: 2000,
    category: "Эндокринология",
    description: "Ультразвуковое исследование щитовидной железы."
  },
  {
    name: "Консультация травматолога",
    price: 2800,
    category: "Травматология",
    description: "Осмотр при травмах, консультация по заболеваниям опорно-двигательного аппарата."
  },
  {
    name: "Рентген",
    price: 1500,
    category: "Диагностика",
    description: "Рентгенографическое исследование."
  },
  {
    name: "МРТ",
    price: 8000,
    category: "Диагностика",
    description: "Магнитно-резонансная томография."
  },
  {
    name: "КТ",
    price: 5000,
    category: "Диагностика",
    description: "Компьютерная томография."
  },
  {
    name: "Консультация психотерапевта",
    price: 3500,
    category: "Психиатрия",
    description: "Консультация по психическому здоровью."
  },
  {
    name: "Консультация гастроэнтеролога",
    price: 3200,
    category: "Гастроэнтерология",
    description: "Консультация по заболеваниям ЖКТ."
  },
  {
    name: "ФГДС",
    price: 3500,
    category: "Гастроэнтерология",
    description: "Фиброгастродуоденоскопия."
  },
  {
    name: "Консультация аллерголога",
    price: 3000,
    category: "Аллергология",
    description: "Консультация по аллергическим заболеваниям."
  },
  {
    name: "Аллергопробы",
    price: 4000,
    category: "Аллергология",
    description: "Кожные аллергические пробы."
  },
  {
    name: "Консультация нарколога",
    price: 3500,
    category: "Наркология",
    description: "Консультация по зависимости."
  },
  {
    name: "Детоксикация",
    price: 8000,
    category: "Наркология",
    description: "Процедура детоксикации организма."
  },
  {
    name: "Общий анализ крови",
    price: 600,
    category: "Диагностика",
    description: "Забор крови и лабораторное исследование."
  },
  {
    name: "Биохимический анализ крови",
    price: 1200,
    category: "Диагностика",
    description: "Расширенное лабораторное обследование."
  },
  {
    name: "Общий анализ мочи",
    price: 400,
    category: "Диагностика",
    description: "Лабораторное исследование мочи."
  }
];

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function makeDateTime(dateStr, hours, minutes = 0) {
  const d = new Date(dateStr);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

async function createScheduleForDoctor(doctorId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i <= 14; i++) {
    const day = addDays(today, i);
    const dow = day.getDay();

    if (dow === 0 || dow === 6) continue;

    const dayStr = day.toISOString().split("T")[0];

    await prisma.schedule.create({
      data: {
        doctorId,
        day: new Date(dayStr),
        startTime: makeDateTime(dayStr, 9, 0),
        endTime: makeDateTime(dayStr, 17, 0),
        interval: 30
      }
    });
  }
}

async function main() {
  console.log("Очистка базы данных...");
  await prisma.medicalAttachment.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.doctorService.deleteMany();
  await prisma.service.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  console.log("Создание технического администратора...");
  const techAdminHash = await bcrypt.hash("techadmin123", 10);
  await prisma.user.create({
    data: {
      email: "techadmin@clinic.ru",
      password: techAdminHash,
      role: "tech_admin",
      emailVerified: true
    }
  });

  console.log("Создание управляющего клиникой...");
  const clinicAdminHash = await bcrypt.hash("clinicadmin123", 10);
  await prisma.user.create({
    data: {
      email: "clinicadmin@clinic.ru",
      password: clinicAdminHash,
      role: "clinic_admin",
      emailVerified: true
    }
  });

  console.log("Генерация хеша пароля врачей...");
  const doctorPasswordHash = await bcrypt.hash("doctor123", 10);

  console.log("Создание услуг...");
  const createdServices = [];
  for (const service of SERVICES) {
    const created = await prisma.service.create({ data: service });
    createdServices.push(created);
  }

  console.log("Создание врачей и связей с услугами...");
  for (const doc of DOCTORS) {
    const user = await prisma.user.create({
      data: {
        email: doc.email,
        password: doctorPasswordHash,
        role: "doctor",
        emailVerified: true
      }
    });

    const doctor = await prisma.doctor.create({
      data: {
        userId: user.id,
        name: doc.name,
        specialty: doc.specialty,
        description: doc.description
      }
    });


    if (doc.services && doc.services.length > 0) {
      for (const serviceName of doc.services) {
        const service = createdServices.find(s => s.name === serviceName);
        if (service) {
          await prisma.doctorService.create({
            data: {
              doctorId: doctor.id,
              serviceId: service.id
            }
          });
        }
      }
    }


    await createScheduleForDoctor(doctor.id);
  }

  console.log("Готово!");
  console.log("Технический админ: techadmin@clinic.ru / techadmin123");
  console.log("Управляющий клиникой: clinicadmin@clinic.ru / clinicadmin123");
  console.log("Врачи: *@clinic.ru / doctor123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());