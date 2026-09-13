import TelegramBot from "node-telegram-bot-api";
import prisma from "./prisma/client.js";

let bot = null;

function initBot() {
  if (!process.env.TELEGRAM_TOKEN) {
    console.warn("TELEGRAM_TOKEN не задан — Telegram-бот отключён");
    return null;
  }

  bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

  bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramUserId = BigInt(msg.from.id);
    const token = match?.[1]?.trim();

    if (!token) {
      bot.sendMessage(
        chatId,
        "Добро пожаловать в бот клиники «Константинополь Мед»!\n\n" +
          "Для подключения уведомлений перейдите по ссылке из личного кабинета на сайте."
      );
      return;
    }

    const patient = await prisma.patient.findUnique({
      where: { telegramLinkToken: token }
    });

    if (!patient) {
      bot.sendMessage(chatId, "Ссылка недействительна. Получите новую ссылку в личном кабинете на сайте.");
      return;
    }

    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        telegramUserId,
        telegramChatId: BigInt(chatId)
      }
    });

    bot.sendMessage(
      chatId,
      `Здравствуйте, ${patient.fullName}!\n\nTelegram успешно подключён. Вы будете получать подтверждения и напоминания о записях.`
    );
  });

  bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;
    const [action, idStr] = query.data.split("_");
    const appointmentId = Number(idStr);

    try {
      if (action === "confirm") {
        await prisma.appointment.update({
          where: { id: appointmentId },
          data: { status: "CONFIRMED" }
        });
        bot.sendMessage(chatId, "Запись подтверждена! Ждём вас в клинике.");
      }

      if (action === "cancel") {
        await prisma.appointment.update({
          where: { id: appointmentId },
          data: { status: "CANCELED" }
        });
        bot.sendMessage(chatId, "Запись отменена. Вы можете записаться снова на сайте.");
      }

      bot.answerCallbackQuery(query.id);
    } catch (err) {
      console.error("Telegram callback error:", err);
      bot.answerCallbackQuery(query.id, { text: "Ошибка обработки" });
    }
  });

  console.log("Telegram-бот запущен");
  return bot;
}

initBot();

export function sendBookingConfirmation(chatId, appointment) {
  if (!bot || !chatId) return;

  const dateStr = new Date(appointment.date).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  });

  bot.sendMessage(
    chatId.toString(),
    `Запись создана!\n\n` +
      `Услуга: ${appointment.service?.name || "—"}\n` +
      `Врач: ${appointment.doctor?.name}\n` +
      `Дата: ${dateStr}\n\n` +
      `Подтвердите или отмените запись:`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Подтвердить", callback_data: `confirm_${appointment.id}` }],
          [{ text: "Отменить", callback_data: `cancel_${appointment.id}` }]
        ]
      }
    }
  );
}

export function sendReminder(chatId, appointment) {
  if (!bot || !chatId) return;

  const dateStr = new Date(appointment.date).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  });

  bot.sendMessage(
    chatId.toString(),
    `Напоминание о записи через 2 часа!\n\n` +
      `Услуга: ${appointment.service?.name || "—"}\n` +
      `Врач: ${appointment.doctor?.name}\n` +
      `Время: ${dateStr}`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Подтвердить", callback_data: `confirm_${appointment.id}` }],
          [{ text: "Отменить", callback_data: `cancel_${appointment.id}` }]
        ]
      }
    }
  );
}
