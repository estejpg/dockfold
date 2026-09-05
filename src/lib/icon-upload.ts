export const MAX_ICON_BYTES = 2 * 1024 * 1024;
export const MIN_ICON_SIZE = 256;
export const MAX_ICON_SIZE = 2048;
export const ICON_SOURCES = [
  "Exported from the Mac app",
  "Downloaded from the official website",
  "Other — explained below",
] as const;

export function iconSizeError(width: number, height: number) {
  if (width !== height)
    return "Choose a square icon with equal width and height.";
  if (width < MIN_ICON_SIZE || width > MAX_ICON_SIZE)
    return "Choose an icon between 256 × 256 and 2048 × 2048 pixels.";
  return "";
}
