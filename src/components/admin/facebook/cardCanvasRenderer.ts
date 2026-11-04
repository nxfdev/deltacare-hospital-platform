import { AvailableDoctorCardData } from "@/server/services/availabilityGeneratorService";

/**
 * Draws a hospital-grade, high-resolution 1080x1080 Facebook promotional card
 * for an available doctor using standard HTML5 Canvas 2D API.
 */
export async function drawDoctorCardToCanvas(
  data: AvailableDoctorCardData,
  canvas: HTMLCanvasElement
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not acquire 2D context");

  const W = 1080;
  const H = 1080;
  canvas.width = W;
  canvas.height = H;

  // 1. Background Gradient (Deep Navy with subtle medical radial glow)
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, "#011c3d"); // Midnight Navy
  bgGrad.addColorStop(0.5, "#012d61"); // DeltaCare Brand Navy
  bgGrad.addColorStop(1, "#001633");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Decorative subtle architectural arc lines
  ctx.save();
  ctx.strokeStyle = "rgba(19, 168, 158, 0.12)"; // Cyan accent
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(W - 100, 100, 380, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  ctx.beginPath();
  ctx.arc(100, H - 100, 420, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 2. Top Header Bar: DeltaCare Hospital Brand & Date Badge
  // Logo container
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 38px Georgia, serif";
  ctx.fillText("Delta", 80, 110);

  ctx.fillStyle = "#38bdf8"; // Light Sky Blue
  ctx.fillText("Care", 180, 110);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.letterSpacing = "2px";
  ctx.fillText("HOSPITAL PLATFORM • BANGLADESH", 80, 138);

  // Date Badge (Right corner)
  const datePillW = 380;
  const datePillH = 54;
  const datePillX = W - 80 - datePillW;
  const datePillY = 82;

  ctx.fillStyle = "rgba(14, 165, 233, 0.15)";
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 1.5;
  roundRect(ctx, datePillX, datePillY, datePillW, datePillH, 27);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`🗓  ${data.consultationDateFormatted}`, datePillX + datePillW / 2, datePillY + 34);
  ctx.textAlign = "left";

  // 3. Status Ribbon: "CONSULTATION AVAILABLE TODAY"
  const ribbonY = 175;
  ctx.fillStyle = "rgba(19, 168, 158, 0.2)";
  ctx.strokeStyle = "#14b8a6";
  ctx.lineWidth = 2;
  roundRect(ctx, 80, ribbonY, W - 160, 52, 10);
  ctx.fill();
  ctx.stroke();

  // Pulse dot
  ctx.fillStyle = "#10b981"; // Emerald
  ctx.beginPath();
  ctx.arc(115, ribbonY + 26, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("DOCTOR AVAILABLE FOR CONSULTATION", 136, ribbonY + 33);

  ctx.fillStyle = "#a7f3d0";
  ctx.font = "bold 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`${data.totalAvailableSlots} SLOTS OPEN`, W - 110, ribbonY + 33);
  ctx.textAlign = "left";

  // 4. Center-Left: Doctor Profile Photograph (Large circular display with glowing ring)
  const photoSize = 340;
  const photoX = 100;
  const photoY = 270;

  // Outer glowing ring
  ctx.save();
  ctx.strokeStyle = "#0057b8";
  ctx.lineWidth = 8;
  ctx.shadowColor = "rgba(56, 189, 248, 0.35)";
  ctx.shadowBlur = 25;
  ctx.beginPath();
  ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2 + 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Draw Doctor Photo (or fallback)
  try {
    const img = await loadImage(data.photoUrl);
    ctx.save();
    ctx.beginPath();
    ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
    ctx.clip();

    // Handling zoom/pan if configured
    const zoom = data.imageCrop?.zoom || 1;
    const panX = (data.imageCrop?.x || 0) * 1.5;
    const panY = (data.imageCrop?.y || 0) * 1.5;

    const drawW = photoSize * zoom;
    const drawH = photoSize * zoom;
    const drawX = photoX - (drawW - photoSize) / 2 + panX;
    const drawY = photoY - (drawH - photoSize) / 2 + panY;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();
  } catch {
    // Fallback initials avatar
    ctx.fillStyle = "#0284c7";
    ctx.beginPath();
    ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 72px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("DR", photoX + photoSize / 2, photoY + photoSize / 2 + 25);
    ctx.textAlign = "left";
  }

  // BMDC Verified Badge Below Photo
  const bmdcY = photoY + photoSize + 22;
  ctx.fillStyle = "#0f172a";
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 1.5;
  roundRect(ctx, photoX + 20, bmdcY, photoSize - 40, 44, 22);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "bold 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`BMDC: ${data.bmdcRegistrationNo}`, photoX + photoSize / 2, bmdcY + 28);
  ctx.textAlign = "left";

  // 5. Center-Right: Doctor Information & Credentials
  const infoX = 490;
  let textY = 310;

  // Department Badge
  ctx.fillStyle = "rgba(56, 189, 248, 0.18)";
  ctx.strokeStyle = "#0284c7";
  ctx.lineWidth = 1;
  const deptW = Math.min(500, ctx.measureText(data.departmentNameEn.toUpperCase()).width + 40);
  roundRect(ctx, infoX, textY - 24, deptW, 36, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(data.departmentNameEn.toUpperCase(), infoX + 18, textY);

  // Doctor Name
  textY += 56;
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 42px Georgia, serif";
  wrapText(ctx, data.nameEn, infoX, textY, 520, 48);

  // Doctor Designation
  textY += 66;
  ctx.fillStyle = "#93c5fd"; // Soft Blue
  ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  wrapText(ctx, data.designationEn, infoX, textY, 510, 28);

  // Qualifications
  textY += 46;
  ctx.fillStyle = "#cbd5e1"; // Slate
  ctx.font = "18px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  wrapText(ctx, data.qualificationsEn, infoX, textY, 510, 26);

  // Primary Specialty Pill
  textY += 48;
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  roundRect(ctx, infoX, textY - 22, 510, 42, 8);
  ctx.fill();
  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(`Specialty: ${data.primarySpecialtyEn}`, infoX + 16, textY + 5);

  // 6. Chamber & Schedule Box (Lower Section)
  const boxY = 700;
  const boxH = 190;
  ctx.fillStyle = "rgba(2, 44, 94, 0.85)";
  ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
  ctx.lineWidth = 2;
  roundRect(ctx, 80, boxY, W - 160, boxH, 20);
  ctx.fill();
  ctx.stroke();

  // Left Column: Branch & Room
  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("HOSPITAL BRANCH & CHAMBER", 120, boxY + 45);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px Georgia, serif";
  ctx.fillText(data.branchNameEn, 120, boxY + 84);

  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(data.roomNumber, 120, boxY + 120);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(`Fee: ৳ ${data.consultationFeeBdt} BDT`, 120, boxY + 152);

  // Vertical Divider in Box
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 + 40, boxY + 25);
  ctx.lineTo(W / 2 + 40, boxY + boxH - 25);
  ctx.stroke();

  // Right Column: Shift Timing
  const rightColX = W / 2 + 80;
  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("TODAY'S CONSULTATION HOURS", rightColX, boxY + 45);

  ctx.fillStyle = "#34d399"; // Bright Emerald
  ctx.font = "bold 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(data.consultationHours, rightColX, boxY + 90);

  ctx.fillStyle = "#f1f5f9";
  ctx.font = "bold 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("Real-time Slot Booking Open", rightColX, boxY + 130);

  // 7. Bottom Action Bar: Booking hotline & web link
  const footerY = 935;
  ctx.fillStyle = "#0284c7"; // DeltaCare Primary Cyan-Blue
  roundRect(ctx, 80, footerY, W - 160, 85, 16);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("📞 24/7 HELPLINE: +8809612310666", 120, footerY + 50);

  ctx.textAlign = "right";
  ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("ONLINE: deltacare.bd/request-appointment ➔", W - 120, footerY + 50);
  ctx.textAlign = "left";
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  let curY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, curY);
      line = words[n] + " ";
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, curY);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

