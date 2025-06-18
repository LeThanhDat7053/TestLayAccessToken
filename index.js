const express = require("express");
const axios = require("axios");
const nodemailer = require("nodemailer");
const app = express();

const PORT = process.env.PORT || 3000;

const APP_ID = process.env.APP_ID;
const APP_SECRET = process.env.APP_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const EMAIL_SEND_TO = process.env.EMAIL_SEND_TO;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

app.get("/", (req, res) => {
  const loginUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=pages_show_list,pages_manage_posts&response_type=code`;
  res.send(`<h2>Facebook OAuth</h2><a href="${loginUrl}">Đăng nhập bằng Facebook</a>`);
});

app.get("/oauth-callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("❌ Thiếu mã code!");

  try {
    // Đổi code thành user access token
    const tokenRes = await axios.get("https://graph.facebook.com/v20.0/oauth/access_token", {
      params: {
        client_id: APP_ID,
        client_secret: APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code,
      },
    });

    const userAccessToken = tokenRes.data.access_token;

    // Lấy danh sách fanpage
    const pagesRes = await axios.get("https://graph.facebook.com/v20.0/me/accounts", {
      params: {
        access_token: userAccessToken,
      },
    });

    const pages = pagesRes.data.data;

    if (!pages.length) {
      return res.send("❌ Không tìm thấy fanpage nào.");
    }

    const selectedPage = pages[0]; // Lấy fanpage đầu tiên
    const pageName = selectedPage.name;
    const pageId = selectedPage.id;
    const pageAccessToken = selectedPage.access_token;

    // Gửi email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Facebook OAuth" <${EMAIL_USER}>`,
      to: EMAIL_SEND_TO,
      subject: `🎉 Page Access Token cho ${pageName}`,
      html: `
        <h3>Thông tin fanpage:</h3>
        <ul>
          <li><strong>Tên page:</strong> ${pageName}</li>
          <li><strong>ID page:</strong> ${pageId}</li>
        </ul>
        <h4>🎯 Page Access Token:</h4>
        <pre>${pageAccessToken}</pre>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.send(`
      ✅ Đã lấy được Page Access Token cho <strong>${pageName}</strong> và gửi về email!
      <br/><br/>
      <code>${pageAccessToken}</code>
    `);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.send("❌ Lỗi khi xử lý OAuth.");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
