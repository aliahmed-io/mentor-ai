import PptxGenJS from "pptxgenjs";

export function createPptTheme(pptx: PptxGenJS) {
  pptx.defineSlideMaster({
    title: "THEME",
    background: { color: "F9FAFB" },
    objects: [
      { rect: { x: 0, y: 6.6, w: 10, h: 0.4, fill: { color: "#E5E7EB" } } },
      { text: { text: "Mentor AI", options: { x: 0.3, y: 6.62, fontSize: 10, color: "6B7280" } } },
    ],
    slideNumber: { x: 9.2, y: 6.6, color: "6B7280", fontSize: 10 },
  });
}

export function addTitleSlide(pptx: PptxGenJS, title: string, subtitle?: string) {
  const slide = pptx.addSlide({ masterName: "THEME" });
  slide.background = { color: "FFFFFF" };
  slide.addText(title || "Presentation", {
    x: 0.7, y: 1.6, w: 8.6, h: 1.2,
    fontSize: 36, bold: true, color: "203764"
  });
  if (subtitle) {
    slide.addText(subtitle, { x: 0.7, y: 2.6, w: 8.6, h: 0.7, fontSize: 18, color: "374151" });
  }
  slide.addShape(pptx.ShapeType.rect, { x: 0.7, y: 3.4, w: 1.8, h: 0.18, fill: { color: "#60A5FA" }, line: { color: "#60A5FA" } });
  return slide;
}

export function addSectionDivider(pptx: PptxGenJS, title: string, subtitle?: string) {
  const slide = pptx.addSlide({ masterName: "THEME" });
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 1.2, fill: { color: "#1D4ED8" }, line: { color: "#1D4ED8" } });
  slide.addText(title || "Section", { x: 0.7, y: 1.8, w: 8.6, h: 0.9, fontSize: 30, bold: true, color: "111827" });
  if (subtitle) slide.addText(subtitle, { x: 0.7, y: 2.6, w: 8.6, h: 0.6, fontSize: 16, color: "4B5563" });
  slide.addShape(pptx.ShapeType.triangle, { x: 8.6, y: 4.6, w: 0.9, h: 0.9, fill: { color: "#93C5FD" }, rotate: 90, line: { color: "#93C5FD" } });
  slide.addShape(pptx.ShapeType.ellipse, { x: 9.2, y: 1.8, w: 0.6, h: 0.6, fill: { color: "#60A5FA" }, line: { color: "#60A5FA" } });
  return slide;
}

export function addBulletsSlide(pptx: PptxGenJS, heading: string, bullets: string[]) {
  const slide = pptx.addSlide({ masterName: "THEME" });
  // Heading with accent bar
  slide.addShape(pptx.ShapeType.rect, { x: 0.7, y: 0.9, w: 0.15, h: 0.9, fill: { color: "#60A5FA" }, line: { color: "#60A5FA" } });
  slide.addText(heading || "Topic", { x: 0.95, y: 0.9, w: 8.4, h: 0.9, fontSize: 22, bold: true, color: "1F2937" });

  // Visual icon placeholder (simple circle)
  slide.addShape(pptx.ShapeType.ellipse, { x: 8.6, y: 0.9, w: 0.6, h: 0.6, fill: { color: "#BFDBFE" }, line: { color: "#BFDBFE" } });
  const items = (bullets || []).map((b) => ("• " + String(b || "").trim().replace(/^[-•]\s*/, ""))).slice(0, 12);
  if (items.length > 6) {
    // two columns
    let y1 = 2.0;
    for (const it of items.slice(0, Math.ceil(items.length / 2))) {
      slide.addText(it, { x: 0.95, y: y1, w: 3.8, h: 0.4, fontSize: 16, color: "111827" });
      y1 += 0.5;
    }
    let y2 = 2.0;
    for (const it of items.slice(Math.ceil(items.length / 2))) {
      slide.addText(it, { x: 5.0, y: y2, w: 3.8, h: 0.4, fontSize: 16, color: "111827" });
      y2 += 0.5;
    }
  } else {
    let y = 2.0;
    for (const it of items) {
      slide.addText(it, { x: 0.95, y, w: 8.2, h: 0.4, fontSize: 16, color: "111827" });
      y += 0.5;
    }
  }
  return slide;
}

export function addClosingSummarySlide(pptx: PptxGenJS, summary: string) {
  const slide = pptx.addSlide({ masterName: "THEME" });
  slide.addText("Key Takeaways", { x: 0.7, y: 0.9, w: 8.6, h: 0.9, fontSize: 24, bold: true, color: "1F2937" });
  const points = (summary || "").split(/\n+/).filter(Boolean).slice(0, 6);
  let y = 1.7;
  for (const p of points) {
    slide.addText("• " + p.trim(), { x: 0.95, y, w: 8.2, h: 0.5, fontSize: 16, color: "111827" });
    y += 0.6;
  }
  if (points.length === 0 && summary) {
    slide.addText(summary.slice(0, 900), { x: 0.95, y: 1.7, w: 8.2, h: 3.5, fontSize: 16, color: "111827" });
  }
  return slide;
}
