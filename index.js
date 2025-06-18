const express = require("express");
const axios = require("axios");
const app = express();

const PORT = process.env.PORT || 3000;

// Cấu hình của ứng dụng Facebook
const APP_ID = process.env.APP_ID || "YOUR_APP_ID";
const APP_SECRET = process.env.APP_SECRET || "YOUR_APP_SECRET";
const REDIRECT_URI = process.env.REDIRECT_URI || "https://your-app-name.up.railway.app/oauth-callback";

app.get("/", (req, res) => {
  const loginUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=pages_show_list,pages_manage_posts&response_type=code`;
  res.send(`
    <h2>Facebook OAuth Demo</h2>
    <a href="${loginUrl}" target="_blank">Đăng nhập với Facebook</a>
  `);
});

app.get("/oauth-callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("Thiếu mã code");

  try {
    const tokenRes = await axios.get("https://graph.facebook.com/v20.0/oauth/access_token", {
      params: {
        client_id: APP_ID,
        client_secret: APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code,
      },
    });

    const userAccessToken = tokenRes.data.access_token;

    // Trả về access token cho người dùng
    res.send(`
      <h2>Access Token của người dùng:</h2>
      <code>${userAccessToken}</code>
    `);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.send("❌ Lỗi khi đổi mã code sang access token.");
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server chạy tại http://localhost:${PORT}`);
});
