/**
 * 全局桌宠：配色 + 显示（localStorage + 自定义事件同步 InteractivePet）
 * 主色经 HSL 推导成套斑纹/耳/腮红/光晕，避免简单混色发灰。
 */
export const DESK_PET_STORAGE_KEY = 'cloudnote-desk-pet-settings-v2';

export type DeskPetSizeId = 'compact' | 'comfortable' | 'large';

/** 主色（毛色基调），#rrggbb */
export const DEFAULT_DESK_PET_COLOR = '#faf3ea';

export interface DeskPetSettings {
  /** 桌宠主色，影响毛色与整套花纹配色 */
  colorHex: string;
  visible: boolean;
  size: DeskPetSizeId;
}

export const DEFAULT_DESK_PET_SETTINGS: DeskPetSettings = {
  colorHex: DEFAULT_DESK_PET_COLOR,
  visible: true,
  size: 'comfortable',
};

export const DESK_PET_CHANGED_EVENT = 'cloudnote-desk-pet-changed';

const LEGACY_STORAGE_KEY = 'cloudnote-desk-pet-settings-v1';

function isHex6(s: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(s);
}

function normalizeColorHex(input: string | undefined): string {
  if (!input || !isHex6(input)) return DEFAULT_DESK_PET_COLOR;
  return input.toLowerCase();
}

function parseHex(hex: string): [number, number, number] | null {
  const h = hex.replace(/^#/, '');
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return [r, g, b];
  }
  return null;
}

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function toHex(rgb: [number, number, number]): string {
  return `#${rgb.map((c) => clamp255(c).toString(16).padStart(2, '0')).join('')}`;
}

function rgbaFromRgb(rgb: [number, number, number], alpha: number): string {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

/** RGB → HSL，h∈[0,360)，s,l∈[0,1] */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max - min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        break;
      case gn:
        h = ((bn - rn) / d + 2) / 6;
        break;
      default:
        h = ((rn - gn) / d + 4) / 6;
    }
  }
  return { h: h * 360, s, l };
}

/** HSL → RGB */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hn = (((h % 360) + 360) % 360) / 360;
  const ss = clamp01(s);
  const ll = clamp01(l);
  if (ss === 0) {
    const v = clamp255(ll * 255);
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
  const p = 2 * ll - q;
  const r = hue2rgb(p, q, hn + 1 / 3);
  const g = hue2rgb(p, q, hn);
  const b = hue2rgb(p, q, hn - 1 / 3);
  return [clamp255(r * 255), clamp255(g * 255), clamp255(b * 255)];
}

/** 沿色环最短路径插值色相 */
function lerpHueDeg(h1: number, h2: number, t: number): number {
  let diff = ((h2 - h1 + 540) % 360) - 180;
  return (h1 + diff * t + 360) % 360;
}

function mixRgb(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  const k = clamp01(t);
  return [
    a[0] + (b[0] - a[0]) * k,
    a[1] + (b[1] - a[1]) * k,
    a[2] + (b[2] - a[2]) * k,
  ];
}

/**
 * 由毛色推导成套配色：橘斑偏姜/虎斑、深斑偏冷灰褐、耳与腮红与主色同系。
 */
function paletteFromFurHex(furHex: string): {
  patchO: string;
  patchD: string;
  ear: string;
  nose: string;
  cheekMid: string;
  cheekEdge: string;
  aura1: string;
  aura2: string;
  auraHappy1: string;
  auraHappy2: string;
  glowRgb: string;
} {
  const base = parseHex(furHex) ?? parseHex(DEFAULT_DESK_PET_COLOR)!;
  let { h, s, l } = rgbToHsl(base[0], base[1], base[2]);

  /** 极低饱和时用工笔橘色作色相锚点，避免斑纹发灰 */
  const hueSeed = s < 0.06 ? 38 : h;

  // 橘/姜斑：色相拉向暖橙，饱和度适中，明度低于毛以「压住」花纹
  const hOrange = lerpHueDeg(hueSeed, 34, 0.62);
  const sOrange = clamp01(0.38 + s * 0.85 + Math.max(0, 0.12 - l) * 0.4);
  const lOrange = clamp01(Math.max(0.36, Math.min(0.58, l - 0.14 + (1 - l) * 0.06)));
  const patchO = toHex(hslToRgb(hOrange, sOrange, lOrange));

  // 深灰褐斑：略偏冷的深褐，与橘斑形成经典三花对比
  const hDark = lerpHueDeg(hueSeed, 258, 0.12);
  const sDark = clamp01(0.14 + s * 0.45);
  const lDark = clamp01(0.15 + (1 - l) * 0.12);
  const patchD = toHex(hslToRgb(hDark, sDark, lDark));

  // 耳内：暖粉，与毛色轻混
  const hEar = lerpHueDeg(hueSeed, 348, 0.55);
  const sEar = clamp01(0.34 + s * 0.5);
  const lEar = clamp01(Math.max(0.82, l + 0.02));
  const earRaw = hslToRgb(hEar, sEar, lEar);
  const ear = toHex(mixRgb(earRaw, base, 0.22));

  // 鼻头：豆沙粉，略跟主色走
  const hNose = lerpHueDeg(hueSeed, 355, 0.48);
  const noseRaw = hslToRgb(hNose, clamp01(0.42 + s * 0.35), 0.79);
  const nose = toHex(mixRgb(noseRaw, base, 0.18));

  // 腮红：同系粉，边缘更浅
  const hCheek = lerpHueDeg(hueSeed, 352, 0.5);
  const cheekMid = toHex(hslToRgb(hCheek, clamp01(0.48 + s * 0.3), 0.8));
  const cheekEdge = toHex(hslToRgb(hCheek, clamp01(0.38 + s * 0.25), 0.88));

  // 光晕：与主色同色相族，半透明叠层
  const hAura = lerpHueDeg(hueSeed, 330, 0.35);
  const rgbAura = hslToRgb(hAura, clamp01(0.55 + s * 0.2), 0.9);
  const aura1 = rgbaFromRgb(rgbAura, 0.38);
  const aura2 = rgbaFromRgb(mixRgb(rgbAura, [255, 255, 255], 0.45), 0.17);

  const rgbHappy = hslToRgb(lerpHueDeg(hueSeed, 12, 0.25), clamp01(0.5 + s * 0.15), 0.88);
  const auraHappy1 = rgbaFromRgb(mixRgb(rgbHappy, [255, 200, 200], 0.35), 0.44);
  const auraHappy2 = rgbaFromRgb(mixRgb(rgbAura, [255, 250, 240], 0.5), 0.22);

  // 外发光与主色呼应
  const glow = mixRgb(hslToRgb(lerpHueDeg(hueSeed, 330, 0.4), 0.55, 0.72), base, 0.25);
  const glowRgb = `${glow[0]}, ${glow[1]}, ${glow[2]}`;

  return {
    patchO,
    patchD,
    ear,
    nose,
    cheekMid,
    cheekEdge,
    aura1,
    aura2,
    auraHappy1,
    auraHappy2,
    glowRgb,
  };
}

export function loadDeskPetSettings(): DeskPetSettings {
  try {
    const v2 = window.localStorage.getItem(DESK_PET_STORAGE_KEY);
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    const raw = v2 || legacy;
    if (!raw) return { ...DEFAULT_DESK_PET_SETTINGS };

    const o = JSON.parse(raw) as Partial<DeskPetSettings> & { species?: string; variant?: string };

    let colorHex = DEFAULT_DESK_PET_COLOR;
    if (typeof o.colorHex === 'string' && isHex6(o.colorHex)) {
      colorHex = o.colorHex.toLowerCase();
    } else if (o.species === 'dog') {
      colorHex = '#f5e6d3';
    }

    const size: DeskPetSizeId =
      o.size === 'compact' || o.size === 'large' || o.size === 'comfortable' ? o.size : 'comfortable';
    const visible = typeof o.visible === 'boolean' ? o.visible : true;
    const next: DeskPetSettings = { colorHex, visible, size };

    if (!v2 && legacy) {
      saveDeskPetSettings(next, { silent: true });
      try {
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }

    return next;
  } catch {
    return { ...DEFAULT_DESK_PET_SETTINGS };
  }
}

type SaveOpts = { silent?: boolean };

export function saveDeskPetSettings(s: DeskPetSettings, opts?: SaveOpts): void {
  const normalized: DeskPetSettings = {
    ...s,
    colorHex: normalizeColorHex(s.colorHex),
  };
  try {
    window.localStorage.setItem(DESK_PET_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    /* ignore */
  }
  if (!opts?.silent) {
    window.dispatchEvent(new CustomEvent(DESK_PET_CHANGED_EVENT));
  }
}

/** 由主色推导全套 CSS 变量（成套斑纹与光晕） */
export function deskPetSettingsCssVars(s: DeskPetSettings): Record<string, string> {
  const fur = normalizeColorHex(s.colorHex);
  const p = paletteFromFurHex(fur);

  return {
    '--pet-fur': fur,
    '--pet-patch-o': p.patchO,
    '--pet-patch-d': p.patchD,
    '--pet-ear': p.ear,
    '--pet-nose': p.nose,
    '--pet-cheek-mid': p.cheekMid,
    '--pet-cheek-edge': p.cheekEdge,
    '--pet-aura-1': p.aura1,
    '--pet-aura-2': p.aura2,
    '--pet-aura-happy-1': p.auraHappy1,
    '--pet-aura-happy-2': p.auraHappy2,
    '--pet-glow-rgb': p.glowRgb,
    '--pet-shadow': 'rgba(15, 23, 42, 0.16)',
  };
}

export const DESK_PET_SIZE_PX: Record<DeskPetSizeId, number> = {
  compact: 120,
  comfortable: 150,
  large: 190,
};
