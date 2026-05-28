import React, { useState, useRef, useEffect } from "react";

// ─── Shared constants ───
const X_RANGE = [-10, 10];
const Y_RANGE = [-10, 10];
const CW = 500;
const CH = 500;

// ─── Shared grid drawing ───
function drawGrid(ctx, w, h, xRange, yRange) {
  const toX = (x) => ((x - xRange[0]) / (xRange[1] - xRange[0])) * w;
  const toY = (y) => h - ((y - yRange[0]) / (yRange[1] - yRange[0])) * h;

  ctx.strokeStyle = "#1a1a2e";
  ctx.lineWidth = 1;
  for (let x = Math.ceil(xRange[0]); x <= xRange[1]; x++) {
    ctx.beginPath();
    ctx.moveTo(toX(x), 0);
    ctx.lineTo(toX(x), h);
    ctx.stroke();
  }
  for (let y = Math.ceil(yRange[0]); y <= yRange[1]; y++) {
    ctx.beginPath();
    ctx.moveTo(0, toY(y));
    ctx.lineTo(w, toY(y));
    ctx.stroke();
  }

  ctx.strokeStyle = "#444466";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(toX(0), 0);
  ctx.lineTo(toX(0), h);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, toY(0));
  ctx.lineTo(w, toY(0));
  ctx.stroke();

  ctx.fillStyle = "#555570";
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  for (let x = Math.ceil(xRange[0]); x <= xRange[1]; x++) {
    if (x === 0) continue;
    ctx.fillText(x, toX(x), toY(0) + 14);
  }
  ctx.textAlign = "right";
  for (let y = Math.ceil(yRange[0]); y <= yRange[1]; y++) {
    if (y === 0) continue;
    ctx.fillText(y, toX(0) - 6, toY(y) + 4);
  }

  return { toX, toY };
}

// ─── Fraction helper ───
function toFraction(numerator, denominator) {
  if (denominator === 0) return "undefined";
  if (numerator === 0) return "0";
  const sign = (numerator * denominator < 0) ? "-" : "";
  let a = Math.abs(numerator);
  let b = Math.abs(denominator);
  while (b) { [a, b] = [b, a % b]; }
  const n = Math.abs(numerator) / a;
  const d = Math.abs(denominator) / a;
  if (d === 1) return sign + n;
  return sign + n + "/" + d;
}

// ─── Pixel to math conversion ───
function pxToMath(clientX, clientY, rect) {
  const px = (clientX - rect.left) * (CW / rect.width);
  const py = (clientY - rect.top) * (CH / rect.height);
  const mx = (px / CW) * (X_RANGE[1] - X_RANGE[0]) + X_RANGE[0];
  const my = ((CH - py) / CH) * (Y_RANGE[1] - Y_RANGE[0]) + Y_RANGE[0];
  return { x: Math.round(mx), y: Math.round(my) };
}

// ─── Shared styles ───
const sliderStyle = { width: "100%", accentColor: "#6c5ce7", marginBottom: 8 };
const sliderLabel = { display: "flex", justifyContent: "space-between", fontSize: 12, color: "#999", marginBottom: 2 };

// ═══════════════════════════════════════
// Tool 1: Linear Explorer
// ═══════════════════════════════════════
function LinearExplorer() {
  const canvasRef = useRef(null);
  const dragging = useRef(null);

  const [mode, setMode] = useState("drag");

  // Drag mode state
  const [p1, setP1] = useState({ x: 0, y: 1 });
  const [p2, setP2] = useState({ x: 3, y: 4 });

  // Equation mode state
  const [eqA, setEqA] = useState(1);
  const [eqB, setEqB] = useState(1);
  const [eqC, setEqC] = useState(0);

  const [numPts, setNumPts] = useState(2);

  // Derived values depend on mode
  let rise, run, slopeStr, slope, yInt;

  if (mode === "drag") {
    rise = p2.y - p1.y;
    run = p2.x - p1.x;
    slopeStr = toFraction(rise, run);
    slope = run !== 0 ? rise / run : Infinity;
    yInt = run !== 0 ? p1.y - slope * p1.x : p1.y;
  } else {
    rise = eqA;
    run = eqB;
    slopeStr = toFraction(eqA, eqB);
    slope = eqB !== 0 ? eqA / eqB : Infinity;
    yInt = eqC;
  }

  // Generate all points along the line
  const allPoints = [];
  if (mode === "drag") {
    if (run !== 0) {
      allPoints.push({ ...p1 });
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      for (let i = 1; i < numPts; i++) {
        const dir = (i % 2 === 1) ? 1 : -1;
        const steps = Math.ceil(i / 2);
        allPoints.push({
          x: p1.x + dir * steps * dx,
          y: p1.y + dir * steps * dy,
        });
      }
      allPoints.sort((a, b) => a.x - b.x);
    } else {
      allPoints.push(p1, p2);
    }
  } else {
    if (eqB !== 0) {
      allPoints.push({ x: 0, y: Math.round(eqC) });
      const firstDir = slope >= 0 ? 1 : -1;
      for (let i = 1; i < numPts; i++) {
        const dir = (i % 2 === 1) ? firstDir : -firstDir;
        const steps = Math.ceil(i / 2);
        const x = dir * steps * eqB;
        const y = slope * x + eqC;
        allPoints.push({ x: Math.round(x), y: Math.round(y) });
      }
      allPoints.sort((a, b) => a.x - b.x);
    }
  }

  // ─── Drawing ───
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CW, CH);

    const { toX, toY } = drawGrid(ctx, CW, CH, X_RANGE, Y_RANGE);

    // Draw the full line
    if (run !== 0) {
      ctx.strokeStyle = "#e85d75";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(toX(X_RANGE[0]), toY(slope * X_RANGE[0] + yInt));
      ctx.lineTo(toX(X_RANGE[1]), toY(slope * X_RANGE[1] + yInt));
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#e85d75";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(toX(p1.x), toY(Y_RANGE[0]));
      ctx.lineTo(toX(p1.x), toY(Y_RANGE[1]));
      ctx.stroke();
    }

    // Draw rise/run triangles between consecutive points
    const triColors = ["#6cc4e8", "#e8a44c", "#7ce88a", "#c87ce8", "#e8e44c", "#e86c6c", "#6ce8b0"];
    for (let i = 0; i < allPoints.length - 1; i++) {
      const a = allPoints[i];
      const b = allPoints[i + 1];
      const color = triColors[i % triColors.length];

      ctx.strokeStyle = color + "88";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(toX(a.x), toY(a.y));
      ctx.lineTo(toX(b.x), toY(a.y));
      ctx.lineTo(toX(b.x), toY(b.y));
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = color;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      const runLabelY = toY(a.y) + (b.y > a.y ? 14 : -6);
      ctx.fillText("run=" + (b.x - a.x), toX((a.x + b.x) / 2), runLabelY);

      ctx.textAlign = "left";
      const riseLabelX = toX(b.x) + 6;
      ctx.fillText("rise=" + (b.y - a.y), riseLabelX, toY((a.y + b.y) / 2) + 4);
    }

    // Draw all points
    allPoints.forEach((pt) => {
      const isP1 = mode === "drag" && pt.x === p1.x && pt.y === p1.y;
      const isP2 = mode === "drag" && pt.x === p2.x && pt.y === p2.y;
      const isEndpoint = isP1 || isP2 || (mode === "equation" && pt.x === 0);
      ctx.fillStyle = isEndpoint ? "#ffffff" : "#aaaacc";
      ctx.strokeStyle = isEndpoint ? "#6cc4e8" : "#6666aa";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(toX(pt.x), toY(pt.y), isEndpoint ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#c8c8d4";
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("(" + pt.x + ", " + pt.y + ")", toX(pt.x), toY(pt.y) - 12);
    });

    // Label P1 and P2 in drag mode only
    if (mode === "drag") {
      ctx.fillStyle = "#6cc4e8";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "left";
      ctx.fillText("P₁", toX(p1.x) + 10, toY(p1.y) + 4);
      ctx.fillText("P₂", toX(p2.x) + 10, toY(p2.y) + 4);
    }
  }, [p1, p2, numPts, slope, yInt, run, rise, allPoints, mode, eqA, eqB, eqC]);

  // ─── Mouse handlers (drag mode only) ───
  const onMouseDown = (e) => {
    if (mode !== "drag") return;
    const rect = canvasRef.current.getBoundingClientRect();
    const m = pxToMath(e.clientX, e.clientY, rect);
    if (Math.hypot(m.x - p2.x, m.y - p2.y) < 1.2) {
      dragging.current = "p2";
    } else if (Math.hypot(m.x - p1.x, m.y - p1.y) < 1.2) {
      dragging.current = "p1";
    }
  };

  const onMouseMove = (e) => {
    if (!dragging.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const m = pxToMath(e.clientX, e.clientY, rect);
    const cx = Math.max(X_RANGE[0] + 1, Math.min(X_RANGE[1] - 1, m.x));
    const cy = Math.max(Y_RANGE[0] + 1, Math.min(Y_RANGE[1] - 1, m.y));
    if (dragging.current === "p1") {
      setP1({ x: cx, y: cy });
    } else {
      setP2({ x: cx, y: cy });
    }
  };

  const onMouseUp = () => { dragging.current = null; };

  // ─── Touch handlers (drag mode only) ───
  const onTouchStart = (e) => {
    if (mode !== "drag") return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const m = pxToMath(touch.clientX, touch.clientY, rect);
    if (Math.hypot(m.x - p2.x, m.y - p2.y) < 1.5) {
      dragging.current = "p2";
    } else if (Math.hypot(m.x - p1.x, m.y - p1.y) < 1.5) {
      dragging.current = "p1";
    }
  };

  const onTouchMove = (e) => {
    if (!dragging.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const m = pxToMath(touch.clientX, touch.clientY, rect);
    const cx = Math.max(X_RANGE[0] + 1, Math.min(X_RANGE[1] - 1, m.x));
    const cy = Math.max(Y_RANGE[0] + 1, Math.min(Y_RANGE[1] - 1, m.y));
    if (dragging.current === "p1") {
      setP1({ x: cx, y: cy });
    } else {
      setP2({ x: cx, y: cy });
    }
  };

  const onTouchEnd = () => { dragging.current = null; };

  return (
    <div>
      {/* Mode toggle */}
      <div style={{ display: "flex", maxWidth: 500, margin: "0 auto 12px", gap: 0 }}>
        {["drag", "equation"].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              flex: 1,
              padding: "8px 0",
              fontSize: 13,
              fontFamily: "inherit",
              background: mode === m ? "#1a1a2e" : "transparent",
              color: mode === m ? "#e8e8f0" : "#555568",
              border: "1px solid #1a1a2e",
              borderBottom: mode === m ? "2px solid #6c5ce7" : "1px solid #1a1a2e",
              cursor: "pointer",
            }}
          >
            {m === "drag" ? "Drag Mode" : "Equation Mode"}
          </button>
        ))}
      </div>

      {/* Equation display */}
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 20, color: "#e8e8f0" }}>
          y = <span style={{ color: "#e85d75" }}>{slopeStr}</span>x
          {yInt !== 0 && run !== 0 && (
            <span style={{ color: "#6cc4e8" }}>
              {" "}{yInt > 0 ? "+" : "−"} {Math.abs(yInt)}
            </span>
          )}
          {run === 0 && <span style={{ color: "#888" }}> (vertical)</span>}
        </div>
        <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
          slope = <span style={{ color: "#e85d75" }}>{slopeStr}</span>
          {" · "}rise = {rise}, run = {run}{" · "}
          y-int = <span style={{ color: "#6cc4e8" }}>{run !== 0 ? yInt : "none"}</span>
        </div>
        <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
          {mode === "drag" ? "drag P₁ or P₂ to move · points snap to grid" : "use sliders to set slope and intercept"}
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={CW}
        height={CH}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          width: "100%",
          maxWidth: 500,
          height: "auto",
          display: "block",
          margin: "0 auto",
          borderRadius: 4,
          cursor: mode === "drag" ? "grab" : "default",
          touchAction: "none",
        }}
      />

      {/* Equation mode sliders */}
      {mode === "equation" && (
        <div style={{ maxWidth: 500, margin: "12px auto 0" }}>
          <label style={sliderLabel}>
            <span>rise (numerator) = <strong style={{ color: "#e85d75" }}>{eqA}</strong></span>
          </label>
          <input type="range" min={-10} max={10} step={1} value={eqA}
            onChange={(e) => setEqA(parseInt(e.target.value))}
            style={{ width: "100%", accentColor: "#e85d75", marginBottom: 8 }} />
          <label style={sliderLabel}>
            <span>run (denominator) = <strong style={{ color: "#e85d75" }}>{eqB}</strong></span>
          </label>
          <input type="range" min={-10} max={10} step={1} value={eqB}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setEqB(val === 0 ? 1 : val);
            }}
            style={{ width: "100%", accentColor: "#e85d75", marginBottom: 8 }} />
          <label style={sliderLabel}>
            <span>y-intercept (b) = <strong style={{ color: "#6cc4e8" }}>{eqC}</strong></span>
          </label>
          <input type="range" min={-9} max={9} step={1} value={eqC}
            onChange={(e) => setEqC(parseInt(e.target.value))}
            style={{ width: "100%", accentColor: "#6cc4e8", marginBottom: 8 }} />
        </div>
      )}

      {/* Points slider */}
      <div style={{ maxWidth: 500, margin: "16px auto 0" }}>
        <label style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#999", marginBottom: 4 }}>
          <span>points on line: <strong style={{ color: "#e8e8f0" }}>{numPts}</strong></span>
          <span>{numPts - 1} triangle{numPts - 1 !== 1 ? "s" : ""}</span>
        </label>
        <input type="range" min={2} max={8} step={1} value={numPts}
          onChange={(e) => setNumPts(parseInt(e.target.value))}
          style={{ width: "100%", accentColor: "#6c5ce7" }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// Tool 2: Quadratic Explorer
// ═══════════════════════════════════════
function QuadraticExplorer() {
  const canvasRef = useRef(null);
  const [a, setA] = useState(1);
  const [h, setH] = useState(0);
  const [k, setK] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const ht = canvas.height;
    ctx.clearRect(0, 0, w, ht);

    const xRange = [-10, 10];
    const yRange = [-10, 10];
    const { toX, toY } = drawGrid(ctx, w, ht, xRange, yRange);

    // Draw parabola
    ctx.strokeStyle = "#e8a44c";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let first = true;
    for (let px = 0; px <= w; px++) {
      const x = xRange[0] + (px / w) * (xRange[1] - xRange[0]);
      const y = a * (x - h) * (x - h) + k;
      const sy = toY(y);
      if (sy < -100 || sy > ht + 100) {
        first = true;
        continue;
      }
      if (first) {
        ctx.moveTo(px, sy);
        first = false;
      } else {
        ctx.lineTo(px, sy);
      }
    }
    ctx.stroke();

    // Vertex
    ctx.fillStyle = "#7ce88a";
    ctx.beginPath();
    ctx.arc(toX(h), toY(k), 6, 0, Math.PI * 2);
    ctx.fill();

    // Axis of symmetry
    ctx.strokeStyle = "#7ce88a44";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(toX(h), 0);
    ctx.lineTo(toX(h), ht);
    ctx.stroke();
    ctx.setLineDash([]);

    // Roots
    const disc = -k / (a || 0.001);
    if (disc >= 0) {
      const r1 = h + Math.sqrt(disc);
      const r2 = h - Math.sqrt(disc);
      ctx.fillStyle = "#e85d75";
      [r1, r2].forEach((r) => {
        if (r >= xRange[0] && r <= xRange[1]) {
          ctx.beginPath();
          ctx.arc(toX(r), toY(0), 5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
  }, [a, h, k]);

  const disc = -k / (a || 0.001);
  const rootLabel = disc < 0 ? "complex roots" : disc === 0 ? "double root" : "2 real roots";

  // Standard form coefficients: y = Ax² + Bx + C
  const stdA = a;
  const stdB = -2 * a * h;
  const stdC = a * h * h + k;

  // Format a term with sign handling
  const fmtTerm = (coeff, variable) => {
    if (Math.abs(coeff) < 0.01) return "";
    const sign = coeff > 0 ? " + " : " − ";
    const abs = Math.abs(coeff);
    const num = abs === 1 && variable ? "" : abs % 1 === 0 ? abs.toFixed(0) : abs.toFixed(1);
    return sign + num + variable;
  };

  const stdForm = (Math.abs(stdA) < 0.01 ? "0" : (stdA === 1 ? "" : stdA === -1 ? "-" : stdA % 1 === 0 ? stdA.toFixed(0) : stdA.toFixed(1)) + "x²")
    + fmtTerm(stdB, "x")
    + fmtTerm(stdC, "");

  // ─── Root formatting with radicals ───
  // From vertex form: x = h ± √(-k/a)
  // Convert to integer fraction to avoid float issues
  function simplifyRadical(n) {
    if (n <= 0) return [0, 0];
    let outside = 1;
    let inside = n;
    for (let i = 2; i * i <= inside; i++) {
      while (inside % (i * i) === 0) {
        outside *= i;
        inside /= (i * i);
      }
    }
    return [outside, inside];
  }

  function gcd(x, y) {
    x = Math.abs(x); y = Math.abs(y);
    while (y) { [x, y] = [y, x % y]; }
    return x;
  }

  function formatRoots() {
    if (Math.abs(a) < 0.01) return "a = 0 (not quadratic)";

    // Convert -k/a to integer fraction
    // a and k are multiples of 0.1, so *10 gives integers
    const num = Math.round(-k * 10);
    const den = Math.round(a * 10);
    // val under radical = num/den

    if (den === 0) return "undefined";

    // Check sign: if num/den < 0, complex roots
    const valSign = (num * den < 0) ? -1 : (num === 0 ? 0 : 1);

    if (valSign === 0) {
      // double root at h
      const hStr = h % 1 === 0 ? h.toFixed(0) : h.toFixed(1);
      return "x = " + hStr + " (double root)";
    }

    const hStr = h % 1 === 0 ? h.toFixed(0) : h.toFixed(1);
    const absNum = Math.abs(num);
    const absDen = Math.abs(den);

    if (valSign < 0) {
      // Complex roots: h ± i√(|num|/|den|)
      // Rationalize: √(absNum/absDen) = √(absNum * absDen) / absDen
      const underRad = absNum * absDen;
      const [radOut, radIn] = simplifyRadical(underRad);
      const g = gcd(radOut, absDen);
      const finalOut = radOut / g;
      const finalDen = absDen / g;

      let radPart = "";
      if (radIn === 1) {
        radPart = finalDen === 1 ? "" + finalOut : finalOut + "/" + finalDen;
      } else {
        const radStr = finalOut === 1 ? "√" + radIn : finalOut + "√" + radIn;
        radPart = finalDen === 1 ? radStr : radStr + "/" + finalDen;
      }
      return "x = " + hStr + " ± " + radPart + "i";
    }

    // Real roots: h ± √(num/den)
    // Rationalize: √(absNum/absDen) = √(absNum * absDen) / absDen
    const underRad = absNum * absDen;
    const [radOut, radIn] = simplifyRadical(underRad);
    const g = gcd(radOut, absDen);
    const finalOut = radOut / g;
    const finalDen = absDen / g;

    if (radIn === 1) {
      // Perfect square — clean roots
      const offset = finalDen === 1 ? finalOut : finalOut + "/" + finalDen;
      const r1 = h + finalOut / finalDen;
      const r2 = h - finalOut / finalDen;
      const r1Str = r1 % 1 === 0 ? r1.toFixed(0) : r1.toFixed(2);
      const r2Str = r2 % 1 === 0 ? r2.toFixed(0) : r2.toFixed(2);
      if (Math.abs(r1 - r2) < 0.001) return "x = " + r1Str;
      return "x = " + r1Str + ", x = " + r2Str;
    }

    // Irrational roots — show radical form
    let radPart = "";
    if (finalOut === 1 && finalDen === 1) {
      radPart = "√" + radIn;
    } else if (finalDen === 1) {
      radPart = finalOut + "√" + radIn;
    } else if (finalOut === 1) {
      radPart = "√" + radIn + "/" + finalDen;
    } else {
      radPart = finalOut + "√" + radIn + "/" + finalDen;
    }

    // Also show decimal approximations
    const sqrtVal = Math.sqrt(absNum / absDen);
    const r1 = h + sqrtVal;
    const r2 = h - sqrtVal;

    return "x = " + hStr + " ± " + radPart + "  (≈ " + r1.toFixed(2) + ", " + r2.toFixed(2) + ")";
  }

  const rootStr = formatRoots();

  return (
    <div>
      <div style={{ marginBottom: 12, textAlign: "center" }}>
        <span style={{ fontSize: 18, color: "#e8e8f0", fontFamily: "monospace" }}>
          y = <span style={{ color: "#e8a44c" }}>{a.toFixed(1)}</span>(x −{" "}
          <span style={{ color: "#7ce88a" }}>{h.toFixed(1)}</span>)² +{" "}
          <span style={{ color: "#6cc4e8" }}>{k.toFixed(1)}</span>
        </span>
        <div style={{ fontSize: 14, color: "#aaa", marginTop: 4, fontFamily: "monospace" }}>
          y = {stdForm || "0"}
        </div>
        <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
          vertex = ({h.toFixed(1)}, {k.toFixed(1)}) · {rootLabel}
        </div>
        <div style={{ fontSize: 12, color: "#e85d75", marginTop: 4, fontFamily: "monospace" }}>
          {rootStr}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        style={{ width: "100%", maxWidth: 500, height: "auto", display: "block", margin: "0 auto", borderRadius: 4 }}
      />
      <div style={{ maxWidth: 500, margin: "12px auto 0" }}>
        <label style={sliderLabel}>
          <span>stretch (a) = <strong style={{ color: "#e8a44c" }}>{a.toFixed(1)}</strong></span>
        </label>
        <input type="range" min={-3} max={3} step={0.1} value={a} onChange={(e) => setA(parseFloat(e.target.value))} style={sliderStyle} />
        <label style={sliderLabel}>
          <span>h = <strong style={{ color: "#7ce88a" }}>{h.toFixed(1)}</strong></span>
        </label>
        <input type="range" min={-5} max={5} step={0.1} value={h} onChange={(e) => setH(parseFloat(e.target.value))} style={sliderStyle} />
        <label style={sliderLabel}>
          <span>k = <strong style={{ color: "#6cc4e8" }}>{k.toFixed(1)}</strong></span>
        </label>
        <input type="range" min={-8} max={8} step={0.1} value={k} onChange={(e) => setK(parseFloat(e.target.value))} style={sliderStyle} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// Tool 3: Correlation Explorer
// ═══════════════════════════════════════
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function generatePoints(r, n = 60) {
  const rand = seededRandom(42);
  const points = [];
  for (let i = 0; i < n; i++) {
    const u1 = rand() || 0.001;
    const u2 = rand();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
    const x = z0;
    const y = r * z0 + Math.sqrt(1 - r * r) * z1;
    points.push([x * 1.8, y * 1.8]);
  }
  return points;
}

function CorrelationExplorer() {
  const canvasRef = useRef(null);
  const [r, setR] = useState(0.7);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const xRange = [-8, 8];
    const yRange = [-8, 8];
    const { toX, toY } = drawGrid(ctx, w, h, xRange, yRange);

    const pts = generatePoints(r);

    let sx = 0, sy = 0, sxx = 0, sxy = 0;
    const n = pts.length;
    pts.forEach(([x, y]) => { sx += x; sy += y; sxx += x * x; sxy += x * y; });
    const mx = sx / n;
    const my = sy / n;
    const slope = (sxy - n * mx * my) / (sxx - n * mx * mx || 1);
    const intercept = my - slope * mx;

    ctx.strokeStyle = "#e85d7566";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(toX(xRange[0]), toY(slope * xRange[0] + intercept));
    ctx.lineTo(toX(xRange[1]), toY(slope * xRange[1] + intercept));
    ctx.stroke();

    pts.forEach(([x, y]) => {
      const dist = Math.abs(y - (slope * x + intercept));
      const alpha = 0.5 + 0.5 * Math.max(0, 1 - dist / 4);
      ctx.fillStyle = "rgba(108, 196, 232, " + alpha + ")";
      ctx.beginPath();
      ctx.arc(toX(x), toY(y), 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [r]);

  return (
    <div>
      <div style={{ marginBottom: 12, textAlign: "center" }}>
        <span style={{ fontSize: 18, color: "#e8e8f0", fontFamily: "monospace" }}>
          r = <span style={{ color: "#6cc4e8" }}>{r.toFixed(2)}</span>
        </span>
        <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
          {Math.abs(r) < 0.1 ? "no correlation" : Math.abs(r) < 0.4 ? "weak" : Math.abs(r) < 0.7 ? "moderate" : "strong"}
          {r > 0.1 ? " positive" : r < -0.1 ? " negative" : ""}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        style={{ width: "100%", maxWidth: 500, height: "auto", display: "block", margin: "0 auto", borderRadius: 4 }}
      />
      <div style={{ maxWidth: 500, margin: "12px auto 0" }}>
        <label style={sliderLabel}>
          <span>correlation (r) = <strong style={{ color: "#6cc4e8" }}>{r.toFixed(2)}</strong></span>
        </label>
        <input type="range" min={-1} max={1} step={0.01} value={r} onChange={(e) => setR(parseFloat(e.target.value))} style={sliderStyle} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#555568", marginTop: 2 }}>
          <span>−1 (perfect negative)</span>
          <span>0</span>
          <span>+1 (perfect positive)</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// Main App
// ═══════════════════════════════════════
const tabs = ["Linear", "Quadratic", "Correlation"];

export default function App() {
  const [active, setActive] = useState(0);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      color: "#c8c8d4",
      fontFamily: "'IBM Plex Mono', monospace",
      padding: "16px 16px 32px",
    }}>
    <div style={{
      position: "fixed",
      bottom: 8,
      right: 12,
      fontSize: 10,
      color: "#333344",
      fontFamily: "inherit",
      pointerEvents: "none",
      userSelect: "none",
    }}> from sansolomath.com
    </div>
      <div style={{
        display: "flex",
        gap: 0,
        marginBottom: 20,
        maxWidth: 500,
        margin: "0 auto 20px",
      }}>
        {tabs.map((t, i) => (
          <button
            key={t}
            onClick={() => setActive(i)}
            style={{
              flex: 1,
              padding: "8px 0",
              fontSize: 13,
              fontFamily: "inherit",
              background: active === i ? "#1a1a2e" : "transparent",
              color: active === i ? "#e8e8f0" : "#555568",
              border: "1px solid #1a1a2e",
              borderBottom: active === i ? "2px solid #6c5ce7" : "1px solid #1a1a2e",
              cursor: "pointer",
            }}
          >
            {t}
          </button>
        ))}
      </div>
      {active === 0 && <LinearExplorer />}
      {active === 1 && <QuadraticExplorer />}
      {active === 2 && <CorrelationExplorer />}
    </div>
  );
}
