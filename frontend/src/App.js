import { useState, useCallback } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer, Tooltip } from "recharts";

const API_URL = "http://127.0.0.1:8000";

// ── Styles ────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #0a0f1a;
    color: #e8eaf0;
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
  }

  .app {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 80% 50% at 20% 0%, rgba(0,200,255,0.07) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 80% 100%, rgba(120,80,255,0.06) 0%, transparent 60%),
      #0a0f1a;
  }

  /* Header */
  .header {
    border-bottom: 1px solid rgba(255,255,255,0.06);
    padding: 20px 40px;
    display: flex;
    align-items: center;
    gap: 16px;
    backdrop-filter: blur(10px);
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(10,15,26,0.85);
  }

  .header-icon {
    width: 40px; height: 40px;
    background: linear-gradient(135deg, #00c8ff, #7050ff);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
  }

  .header-title {
    font-family: 'DM Serif Display', serif;
    font-size: 22px;
    background: linear-gradient(135deg, #ffffff, #a0b4cc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .header-badge {
    margin-left: auto;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #00c8ff;
    border: 1px solid rgba(0,200,255,0.3);
    padding: 4px 10px;
    border-radius: 20px;
    background: rgba(0,200,255,0.05);
  }

  /* Main layout */
  .main {
    max-width: 1100px;
    margin: 0 auto;
    padding: 48px 32px;
  }

  .hero {
    text-align: center;
    margin-bottom: 56px;
  }

  .hero-tag {
    display: inline-block;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #00c8ff;
    margin-bottom: 16px;
    opacity: 0.8;
  }

  .hero-title {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(32px, 5vw, 52px);
    line-height: 1.15;
    color: #ffffff;
    margin-bottom: 16px;
  }

  .hero-title em {
    font-style: italic;
    background: linear-gradient(135deg, #00c8ff, #7050ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-sub {
    font-size: 16px;
    color: rgba(232,234,240,0.5);
    max-width: 480px;
    margin: 0 auto;
    line-height: 1.7;
    font-weight: 300;
  }

  /* Cards */
  .card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 32px;
    backdrop-filter: blur(10px);
  }

  .card-title {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.35);
    margin-bottom: 24px;
  }

  /* Upload zone */
  .upload-zone {
    border: 2px dashed rgba(0,200,255,0.2);
    border-radius: 16px;
    padding: 56px 32px;
    text-align: center;
    cursor: pointer;
    transition: all 0.25s ease;
    position: relative;
    overflow: hidden;
    background: rgba(0,200,255,0.02);
  }

  .upload-zone:hover, .upload-zone.drag-over {
    border-color: rgba(0,200,255,0.5);
    background: rgba(0,200,255,0.05);
    transform: translateY(-2px);
  }

  .upload-zone input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
    height: 100%;
  }

  .upload-icon {
    font-size: 40px;
    margin-bottom: 16px;
    display: block;
    opacity: 0.6;
  }

  .upload-text {
    font-size: 16px;
    color: rgba(255,255,255,0.7);
    margin-bottom: 8px;
    font-weight: 500;
  }

  .upload-hint {
    font-size: 13px;
    color: rgba(255,255,255,0.3);
    font-family: 'DM Mono', monospace;
  }

  /* Preview */
  .preview-img {
    width: 100%;
    max-height: 260px;
    object-fit: contain;
    border-radius: 12px;
    filter: brightness(0.95);
  }

  /* Analyze button */
  .btn-analyze {
    width: 100%;
    padding: 16px;
    background: linear-gradient(135deg, #00c8ff, #7050ff);
    border: none;
    border-radius: 12px;
    color: white;
    font-size: 15px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    margin-top: 20px;
    transition: all 0.2s ease;
    letter-spacing: 0.3px;
  }

  .btn-analyze:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 8px 32px rgba(0,200,255,0.25);
  }

  .btn-analyze:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }

  .btn-reset {
    width: 100%;
    padding: 12px;
    background: transparent;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    color: rgba(255,255,255,0.4);
    font-size: 13px;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    margin-top: 10px;
    transition: all 0.2s ease;
  }

  .btn-reset:hover { color: rgba(255,255,255,0.7); border-color: rgba(255,255,255,0.2); }

  /* Loading */
  .loading-wrap {
    text-align: center;
    padding: 40px 0;
  }

  .spinner {
    width: 44px; height: 44px;
    border: 3px solid rgba(0,200,255,0.1);
    border-top-color: #00c8ff;
    border-radius: 50%;
    animation: spin 0.9s linear infinite;
    margin: 0 auto 20px;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .loading-text {
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    color: rgba(255,255,255,0.4);
  }

  .loading-steps { margin-top: 12px; }
  .loading-step {
    font-size: 12px;
    color: rgba(0,200,255,0.5);
    margin: 4px 0;
    font-family: 'DM Mono', monospace;
  }

  /* Result: diagnosis banner */
  .diagnosis-banner {
    border-radius: 16px;
    padding: 24px 28px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 20px;
    position: relative;
    overflow: hidden;
  }

  .diagnosis-banner.normal {
    background: linear-gradient(135deg, rgba(0,200,100,0.12), rgba(0,200,100,0.05));
    border: 1px solid rgba(0,200,100,0.25);
  }

  .diagnosis-banner.pneumonia {
    background: linear-gradient(135deg, rgba(255,60,60,0.12), rgba(255,60,60,0.05));
    border: 1px solid rgba(255,60,60,0.25);
  }

  .diagnosis-emoji { font-size: 40px; flex-shrink: 0; }

  .diagnosis-class {
    font-family: 'DM Serif Display', serif;
    font-size: 28px;
    color: #ffffff;
    line-height: 1.1;
  }

  .diagnosis-confidence {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    margin-top: 6px;
  }

  .conf-badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  /* Probability bars */
  .prob-row {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 14px;
  }

  .prob-label {
    width: 90px;
    font-size: 13px;
    color: rgba(255,255,255,0.6);
    font-family: 'DM Mono', monospace;
    flex-shrink: 0;
  }

  .prob-bar-wrap {
    flex: 1;
    height: 8px;
    background: rgba(255,255,255,0.06);
    border-radius: 4px;
    overflow: hidden;
  }

  .prob-bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
  }

  .prob-value {
    width: 50px;
    text-align: right;
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    color: rgba(255,255,255,0.8);
  }

  /* Images grid */
  .images-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 8px;
  }

  .img-block { text-align: center; }

  .img-label {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.3);
    margin-bottom: 10px;
  }

  .img-block img {
    width: 100%;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.08);
  }

  /* Clinical notes */
  .clinical-summary {
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 10px;
  }

  .clinical-detail {
    font-size: 14px;
    color: rgba(255,255,255,0.55);
    line-height: 1.7;
    margin-bottom: 16px;
  }

  .clinical-suggestion {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 14px 16px;
    background: rgba(255,255,255,0.04);
    border-radius: 10px;
    border-left: 3px solid #00c8ff;
    font-size: 13px;
    color: rgba(255,255,255,0.65);
    line-height: 1.6;
  }

  /* Disclaimer */
  .disclaimer {
    text-align: center;
    font-size: 12px;
    color: rgba(255,255,255,0.2);
    margin-top: 48px;
    line-height: 1.8;
    font-family: 'DM Mono', monospace;
  }

  /* Layout grid */
  .layout-grid {
    display: grid;
    grid-template-columns: 380px 1fr;
    gap: 24px;
    align-items: start;
  }

  @media (max-width: 768px) {
    .layout-grid { grid-template-columns: 1fr; }
    .main { padding: 32px 20px; }
    .header { padding: 16px 20px; }
  }

  /* Error */
  .error-box {
    background: rgba(255,60,60,0.08);
    border: 1px solid rgba(255,60,60,0.2);
    border-radius: 12px;
    padding: 16px 20px;
    font-size: 13px;
    color: rgba(255,120,120,0.9);
    margin-top: 16px;
    font-family: 'DM Mono', monospace;
  }

  /* Quantum info chip */
  .quantum-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    background: rgba(112,80,255,0.1);
    border: 1px solid rgba(112,80,255,0.2);
    border-radius: 20px;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: rgba(180,160,255,0.8);
    margin-bottom: 24px;
  }
`;

// ── Components ────────────────────────────────────────────

function ConfidenceBadge({ level, color }) {
  const bg = {
    "RẤT CAO":   "rgba(231,76,60,0.15)",
    "CAO":       "rgba(230,126,34,0.15)",
    "TRUNG BÌNH":"rgba(243,156,18,0.15)",
    "THẤP":      "rgba(39,174,96,0.15)",
  }[level] || "rgba(255,255,255,0.1)";

  return (
    <span className="conf-badge" style={{ background: bg, color }}>
      {level}
    </span>
  );
}

function ProbabilityBars({ probability }) {
  const items = [
    { label: "Normal",    value: probability.Normal,    color: "#00c864" },
    { label: "Pneumonia", value: probability.Pneumonia, color: "#ff4444" },
  ];
  return (
    <div>
      {items.map(({ label, value, color }) => (
        <div className="prob-row" key={label}>
          <span className="prob-label">{label}</span>
          <div className="prob-bar-wrap">
            <div
              className="prob-bar-fill"
              style={{ width: `${(value * 100).toFixed(1)}%`, background: color }}
            />
          </div>
          <span className="prob-value">{(value * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

function ResultPanel({ data }) {
  const isPneumonia = data.class_id === 1;
  const chartData = [
    { name: "Normal",    value: +(data.probability.Normal * 100).toFixed(1),    fill: "#00c864" },
    { name: "Pneumonia", value: +(data.probability.Pneumonia * 100).toFixed(1), fill: "#ff4444" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Diagnosis Banner */}
      <div className={`diagnosis-banner ${isPneumonia ? "pneumonia" : "normal"}`}>
        <span className="diagnosis-emoji">{isPneumonia ? "🫁" : "✅"}</span>
        <div>
          <div className="diagnosis-class">{data.class_name}</div>
          <div className="diagnosis-confidence" style={{ marginTop: 8 }}>
            <span style={{ color: "rgba(255,255,255,0.4)", marginRight: 8, fontSize: 12 }}>
              Độ tin cậy
            </span>
            <ConfidenceBadge
              level={data.confidence_level}
              color={data.confidence_color}
            />
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 13,
              color: "rgba(255,255,255,0.6)",
              marginLeft: 10
            }}>
              {(data.confidence * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Probability */}
      <div className="card">
        <div className="card-title">Xác suất phân loại</div>
        <ProbabilityBars probability={data.probability} />
        <div style={{ marginTop: 24, height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={48}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12, fontFamily: "DM Mono" }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "DM Mono" }}
                axisLine={false} tickLine={false}
                tickFormatter={v => `${v}%`}
              />
              <Tooltip
                formatter={v => [`${v}%`, "Probability"]}
                contentStyle={{
                  background: "#111827",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontFamily: "DM Mono",
                  fontSize: 12
                }}
              />
              <Bar dataKey="value" radius={[6,6,0,0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grad-CAM Images */}
      <div className="card">
        <div className="card-title">Grad-CAM Visualization</div>
        <div className="images-grid">
          <div className="img-block">
            <div className="img-label">X-Ray gốc</div>
            <img src={`data:image/png;base64,${data.original_image}`} alt="Original" />
          </div>
          <div className="img-block">
            <div className="img-label">Vùng tập trung</div>
            <img src={`data:image/png;base64,${data.gradcam_image}`} alt="Grad-CAM" />
          </div>
        </div>
        <p style={{
          fontSize: 11, color: "rgba(255,255,255,0.25)",
          marginTop: 12, fontFamily: "DM Mono", lineHeight: 1.6
        }}>
          Vùng màu đỏ/vàng là nơi model tập trung phân tích để đưa ra kết quả.
        </p>
      </div>

      {/* Clinical Notes */}
      <div className="card">
        <div className="card-title">Nhận định lâm sàng</div>
        <div className="clinical-summary">{data.clinical.summary}</div>
        <div className="clinical-detail">{data.clinical.detail}</div>
        <div className="clinical-suggestion">
          <span>💡</span>
          <span>{data.clinical.suggestion}</span>
        </div>
      </div>

    </div>
  );
}

// ── Main App ──────────────────────────────────────────────
export default function App() {
  const [image, setImage]       = useState(null);
  const [preview, setPreview]   = useState(null);
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [step, setStep]         = useState(0);

  const STEPS = [
    "Đang tải ảnh lên server...",
    "Chạy CNN backbone...",
    "Chạy Quantum Circuit (8 qubit)...",
    "Tạo Grad-CAM heatmap...",
    "Hoàn thành!"
  ];

  const handleFile = useCallback((file) => {
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  }, [handleFile]);

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    setStep(0);

    // Simulate step progress
    const timer = setInterval(() => {
      setStep(s => (s < STEPS.length - 2 ? s + 1 : s));
    }, 800);

    try {
      const formData = new FormData();
      formData.append("file", image);
      const resp = await axios.post(`${API_URL}/predict`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      clearInterval(timer);
      setStep(STEPS.length - 1);
      await new Promise(r => setTimeout(r, 400));
      setResult(resp.data.data);
    } catch (err) {
      clearInterval(timer);
      setError(err.response?.data?.detail || "Không kết nối được server. Kiểm tra backend đang chạy.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setStep(0);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app">

        {/* Header */}
        <header className="header">
          <div className="header-icon">🫁</div>
          <div className="header-title">HQCNN Medical</div>
          <div className="header-badge">⚛ 8-Qubit VQC</div>
        </header>

        <main className="main">

          {/* Hero */}
          <div className="hero">
            <div className="hero-tag">Hybrid Quantum-Classical AI</div>
            <h1 className="hero-title">
              Chẩn đoán X-quang<br /><em>hỗ trợ bởi Quantum AI</em>
            </h1>
            <p className="hero-sub">
              Mô hình HQCNN kết hợp CNN và mạch lượng tử 8-qubit
              để phân tích X-quang phổi, phát hiện viêm phổi.
            </p>
          </div>

          <div className="layout-grid">

            {/* Left: Upload */}
            <div>
              <div className="card">
                <div className="card-title">Upload ảnh X-quang</div>

                <div className="quantum-chip">
                  <span>⚛</span>
                  <span>HQCNN V2 · PneumoniaMNIST · 8 Qubits</span>
                </div>

                {!preview ? (
                  <div
                    className={`upload-zone ${dragOver ? "drag-over" : ""}`}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFile(e.target.files[0])}
                    />
                    <span className="upload-icon">🩻</span>
                    <div className="upload-text">Kéo thả hoặc click để chọn ảnh</div>
                    <div className="upload-hint">JPG · PNG · WEBP · Tối đa 10MB</div>
                  </div>
                ) : (
                  <div>
                    <img src={preview} alt="Preview" className="preview-img" />
                    <p style={{
                      fontSize: 12, color: "rgba(255,255,255,0.3)",
                      textAlign: "center", marginTop: 8,
                      fontFamily: "DM Mono"
                    }}>
                      {image?.name}
                    </p>
                  </div>
                )}

                {loading ? (
                  <div className="loading-wrap">
                    <div className="spinner" />
                    <div className="loading-text">Đang phân tích...</div>
                    <div className="loading-steps">
                      {STEPS.map((s, i) => (
                        <div key={i} className="loading-step" style={{
                          opacity: i <= step ? 1 : 0.2,
                          color: i === step ? "#00c8ff" : "rgba(0,200,255,0.4)"
                        }}>
                          {i < step ? "✓" : i === step ? "›" : "·"} {s}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      className="btn-analyze"
                      onClick={handleAnalyze}
                      disabled={!image}
                    >
                      {image ? "⚛ Phân tích với Quantum AI" : "Chọn ảnh trước"}
                    </button>
                    {image && (
                      <button className="btn-reset" onClick={handleReset}>
                        Chọn ảnh khác
                      </button>
                    )}
                  </>
                )}

                {error && <div className="error-box">⚠ {error}</div>}
              </div>

              {/* Info card */}
              <div className="card" style={{ marginTop: 20 }}>
                <div className="card-title">Về mô hình</div>
                {[
                  ["Kiến trúc",  "HQCNN V2 (Hybrid)"],
                  ["Quantum",    "8-qubit VQC · U3 · CNOT"],
                  ["Dataset",    "PneumoniaMNIST · 5,856 ảnh"],
                  ["Độ chính xác","~92% · AUC ~96%"],
                  ["Paper",      "arXiv:2509.14277"],
                ].map(([k, v]) => (
                  <div key={k} style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    fontSize: 13
                  }}>
                    <span style={{ color: "rgba(255,255,255,0.35)", fontFamily: "DM Mono" }}>{k}</span>
                    <span style={{ color: "rgba(255,255,255,0.7)" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Result */}
            <div>
              {result ? (
                <ResultPanel data={result} />
              ) : (
                <div className="card" style={{
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  minHeight: 400, textAlign: "center", gap: 16
                }}>
                  <div style={{ fontSize: 56, opacity: 0.15 }}>⚛</div>
                  <div style={{
                    fontFamily: "DM Mono", fontSize: 13,
                    color: "rgba(255,255,255,0.2)", lineHeight: 1.8
                  }}>
                    Upload ảnh X-quang và nhấn<br />
                    "Phân tích với Quantum AI"<br />
                    để xem kết quả tại đây
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Disclaimer */}
          <div className="disclaimer">
            ⚠ Kết quả chỉ mang tính tham khảo nghiên cứu · Không thay thế chẩn đoán y khoa<br />
            HQCNN · Luận văn tốt nghiệp · Khoa Điện tử - Viễn thông
          </div>

        </main>
      </div>
    </>
  );
}
