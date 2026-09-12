export const theme = {
  colors: {
    navy: "#0A1F44",
    navyDark: "#061530",
    navyCard: "#1A2B4A",
    gold: "#D4AF37",
    goldLight: "#F5E6B8",
    goldDark: "#B8912A",
    silver: "#C0C6CC",
    silverLight: "#F8F9FB",
    white: "#FFFFFF",
    text: "#1A1A1A",
    textMuted: "#6B7280",
    textFaint: "#9CA3AF",
    success: "#10B981",
    successBg: "#ECFDF5",
    warning: "#F59E0B",
    warningBg: "#FEF3C7",
    error: "#EF4444",
    errorBg: "#FEE2E2",
    info: "#3B82F6",
    infoBg: "#EFF6FF",
    border: "#E5E7EB",
  },
  fonts: {
    body: "'Inter', Helvetica, Arial, sans-serif",
    code: "'Courier New', 'SF Mono', Monaco, monospace",
  },
  radius: { sm: "8px", md: "12px", lg: "16px", xl: "24px", pill: "999px" },
  spacing: { xs: "8px", sm: "16px", md: "24px", lg: "32px", xl: "48px" },
  maxWidth: 600,
} as const;

export const c = theme.colors;
export const font = theme.fonts.body;

// <head> CSS: client resets, dark mode, mobile stacking.
export const headStyles = `
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  table,td{mso-table-lspace:0;mso-table-rspace:0;}
  img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none;}
  body{margin:0;padding:0;width:100%!important;height:100%!important;background:${c.silverLight};}
  a{color:${c.navy};}
  @media (prefers-color-scheme: dark) {
    .dm-body { background:${c.navyDark} !important; }
    .dm-card { background:${c.navyCard} !important; }
    .dm-inner { background:#22345A !important; border-color:#2E4270 !important; }
    .dm-text { color:${c.silverLight} !important; }
    .dm-muted { color:${c.silver} !important; }
    .dm-footer { background:${c.navyDark} !important; border-color:#1A2B4A !important; }
    .dm-divider { border-color:#2E4270 !important; }
  }
  @media screen and (max-width:600px) {
    .container { width:100% !important; border-radius:0 !important; }
    .pad { padding:28px 20px !important; }
    .otp-code { font-size:34px !important; letter-spacing:8px !important; text-indent:8px !important; }
    .otp-box { padding:22px 24px !important; }
    .btn { display:block !important; width:100% !important; box-sizing:border-box !important; }
    .stack { display:block !important; width:100% !important; }
    .h1 { font-size:22px !important; }
    .stat { display:block !important; width:100% !important; margin-bottom:12px !important; }
  }
`;
