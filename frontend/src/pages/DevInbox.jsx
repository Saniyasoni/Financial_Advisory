import { useState, useEffect } from "react";
import axios from "axios";

export default function DevInbox() {
  const [sender, setSender] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState("sms");
  const [toPhone, setToPhone] = useState("");
  const [toEmail, setToEmail] = useState("");
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);

  // Live preview parser (frontend mirror of backend rules)
  useEffect(() => {
  const user = JSON.parse(localStorage.getItem("user"));
  setToPhone(user.phone);
  setToEmail(user.email);
}, []);

  useEffect(() => {
    const text = body.toLowerCase();
    let amount = text.match(/₹?\s?(\d+(\.\d+)?)/);
    let merchant = text.match(/(amazon|zomato|uber|flipkart|paytm|swiggy|dmrc|nmrc)/);
    let type = text.includes("credited") ? "income" : "expense";

    if (amount) {
      setPreview({
        amount: amount[1],
        merchant: merchant?.[1] || "Unknown",
        type,
        confidence: merchant ? "High" : "Low"
      });
    } else {
      setPreview(null);
    }
  }, [body]);

  async function send() {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        "http://localhost:5000/api/dev/inbox",
        {sender,body,channel,subject,toPhone,toEmail},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResult(res.data);
    } catch(e) {
      alert(e.response?.data?.message || "failed");
    }
  }

  return (
    <div className="dev-root">
      <div className="mail-window">

        {/* Header */}
        <div className="mail-header">
          <div className="mail-user">
            <div className="avatar">🏦</div>
            <span>FinTrack Gateway</span>
          </div>
          <div className="mail-controls">
            <span>—</span>
            <span>□</span>
            <span>×</span>
          </div>
        </div>

        {/* From Row */}
        <div className="mail-row">
          <span className="label">From</span>
          <input
            value={sender}
            onChange={e => setSender(e.target.value)}
            placeholder="alerts@hdfcbank.com"
          />
          <select value={channel} onChange={e => setChannel(e.target.value)}>
            <option value="sms">SMS</option>
            <option value="email">Email</option>
          </select>
        </div>'
        {/* To Row – User identity */}
            <div className="mail-row">
            <span className="label">To</span>

            {channel === "sms" ? (
                <input
                placeholder="User phone e.g. 9876543210"
                value={toPhone}
                onChange={e => setToPhone(e.target.value)}
                />
            ) : (
                <input
                placeholder="User email e.g. gunjit@gmail.com"
                value={toEmail}
                onChange={e => setToEmail(e.target.value)}
                />
            )}
            </div>
'

        {channel === "email" && (
          <div className="mail-row">
            <span className="label">Subject</span>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Transaction Alert"
            />
          </div>
        )}

        {/* Fake toolbar */}
        <div className="toolbar">
          <span>B</span>
          <span>I</span>
          <span>U</span>
          <span>•</span>
          <span>🔗</span>
        </div>

        {/* Body */}
        <textarea
          className="mail-body"
          placeholder="Paste SMS / Email here…"
          value={body}
          onChange={e => setBody(e.target.value)}
        />

        {/* Attachments */}
        <div className="attachments">
          📎 receipt.pdf
        </div>

        {/* Footer */}
        <div className="mail-footer">
          <span className="status">
            {preview ? `Detected ${preview.type} of ₹${preview.amount}` : "Waiting for content"}
          </span>
          <button className="send-btn" onClick={send}>Send Now</button>
        </div>
      </div>

      {/* Live Preview */}
      <div className="preview-panel">
        <h4>Live Parser</h4>
        {preview ? (
          <>
            <p><b>Amount:</b> ₹{preview.amount}</p>
            <p><b>Merchant:</b> {preview.merchant}</p>
            <p><b>Type:</b> {preview.type}</p>
            <p><b>Confidence:</b> {preview.confidence}</p>
          </>
        ) : (
          <p>No data detected</p>
        )}
      </div>

      {result && (
        <div className="result-panel">
          <h4>Ingestion Result</h4>
          {result.transaction ? (
        <>
            <p>Amount: ₹{result.transaction.amount}</p>
            <p>Merchant: {result.transaction.description}</p>
            <p>Category: {result.transaction.category}</p>
            <p>Status: Inserted</p>
        </>
        ) : (
            <p>Status: Stored but not parsed</p>
        )}

        </div>
      )}

      <style>{css}</style>
    </div>
  );
}

const css = `
.dev-root{
  min-height:100vh;
  background:#FAF1E6;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:24px;
  padding:40px;
  font-family:Poppins;
}

.mail-window{
  width:520px;
  background:#FFF3E6;
  border-radius:24px;
  box-shadow:0 20px 60px rgba(0,0,0,0.12);
  padding:20px;
  display:flex;
  flex-direction:column;
  gap:12px;
}

.mail-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
}

.avatar{
  background:#EEC1A0;
  width:36px;
  height:36px;
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
}

.mail-user{
  display:flex;
  gap:10px;
  align-items:center;
}

.mail-controls span{
  margin-left:12px;
  cursor:pointer;
}

.mail-row{
  display:flex;
  gap:10px;
  align-items:center;
}

.mail-row input{
  flex:1;
  border:none;
  background:transparent;
  font-size:14px;
  outline:none;
}

.label{
  width:60px;
  font-size:12px;
  color:#888;
}

.toolbar span{
  margin-right:10px;
  cursor:pointer;
}

.mail-body{
  background:#FAF1E6;
  border:none;
  padding:14px;
  border-radius:16px;
  min-height:140px;
  resize:none;
  font-size:14px;
}

.attachments{
  font-size:12px;
  color:#555;
}

.mail-footer{
  display:flex;
  justify-content:space-between;
  align-items:center;
}

.send-btn{
  background:black;
  color:white;
  border:none;
  padding:10px 20px;
  border-radius:14px;
  cursor:pointer;
}

.preview-panel,
.result-panel{
  background:#FFF3E6;
  padding:20px;
  border-radius:20px;
  width:260px;
  box-shadow:0 10px 30px rgba(0,0,0,0.08);
}
`;
