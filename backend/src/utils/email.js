import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendVerificationEmail(email, token) {
  const confirmUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/confirm?token=${token}`;
  const rejectUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/confirm?token=${token}&action=reject`;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Константинополь Мед" <noreply@clinic.ru>',
    to: email,
    subject: "Подтверждение регистрации в клинике «Константинополь Мед»",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0d6e8a;">Добро пожаловать в клинику «Константинополь Мед»!</h2>
        <p>Вы зарегистрировались на нашем сайте. Для завершения регистрации, пожалуйста, подтвердите ваш email.</p>
        <p>Нажмите кнопку ниже, чтобы подтвердить регистрацию:</p>
        <div style="margin: 30px 0;">
          <a href="${confirmUrl}" style="background: #0d6e8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
            Подтвердить регистрацию
          </a>
        </div>
        <p>Если вы не регистрировались на нашем сайте, нажмите кнопку ниже для отмены:</p>
        <div style="margin: 30px 0;">
          <a href="${rejectUrl}" style="background: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
            Отменить регистрацию
          </a>
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Ссылка действительна в течение 24 часов.<br>
          Если кнопки не работают, скопируйте и вставьте ссылку в браузер:<br>
          ${confirmUrl}
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Verification email sent to:", email);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
}

export async function sendAppointmentCancellationEmail(email, patientName, doctorName, appointmentDate, reason) {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Константинополь Мед" <noreply@clinic.ru>',
    to: email,
    subject: "Отмена записи в клинике «Константинополь Мед»",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #e74c3c;">Отмена записи</h2>
        <p>Уважаемый(ая) ${patientName}!</p>
        <p>Сообщаем вам, что ваша запись к врачу <strong>${doctorName}</strong> на ${new Date(appointmentDate).toLocaleString("ru-RU")} была отменена.</p>
        <p><strong>Причина:</strong> ${reason}</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #27ae60; font-weight: 600;">💰 Деньги за запись возвращены на ваш счёт.</p>
        </div>
        <p>Приносим свои извинения за доставленные неудобства.</p>
        <p>Вы можете записаться к другому врачу через наш сайт.</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/doctors" style="background: #0d6e8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
            Выбрать другого врача
          </a>
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Если у вас есть вопросы, свяжитесь с нами по телефону.<br>
          С уважением, команда клиники «Константинополь Мед»
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Cancellation email sent to:", email);
  } catch (error) {
    console.error("Error sending cancellation email:", error);
    throw error;
  }
}
