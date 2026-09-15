import "server-only";
import QRCode from "qrcode";

export async function generateQrDataUrl(verifyUrl: string): Promise<string> {
  return QRCode.toDataURL(verifyUrl, {
    width: 300,
    margin: 2,
    color: { dark: "#0A1F44", light: "#ffffff" },
  });
}
