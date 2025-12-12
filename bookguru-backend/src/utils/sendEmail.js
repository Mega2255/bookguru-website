import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, message }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"BookGuru Support" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: `
      <div style="font-family: Arial; padding: 20px;">
        <h2>${subject}</h2>
        <p>${message}</p>
        <br/>
        <p>If you did not request this password reset, please ignore this message.</p>
      </div>
    `,
  });
};
