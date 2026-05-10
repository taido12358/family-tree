/**
 * Tạo gradient deterministic từ tên để dùng làm avatar.
 */
const PALETTE: [string, string][] = [
  ["#a78bfa", "#67e8f9"],
  ["#f472b6", "#a78bfa"],
  ["#fbbf24", "#f472b6"],
  ["#67e8f9", "#34d399"],
  ["#fb7185", "#fbbf24"],
  ["#c084fc", "#22d3ee"],
  ["#fde047", "#a78bfa"],
  ["#fda4af", "#c084fc"],
];

export function avatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % PALETTE.length;
  const [a, b] = PALETTE[idx];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  // Vietnamese name: take last part (given name) + middle if 3+ parts
  const last = parts[parts.length - 1][0]?.toUpperCase() ?? "";
  const first = parts[0][0]?.toUpperCase() ?? "";
  return first + last;
}
