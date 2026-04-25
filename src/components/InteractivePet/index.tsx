import { useLocation } from '@umijs/max';
import {
  DEFAULT_DESK_PET_SETTINGS,
  DESK_PET_CHANGED_EVENT,
  DESK_PET_SIZE_PX,
  deskPetSettingsCssVars,
  loadDeskPetSettings,
  type DeskPetSettings,
} from '@/utils/desk-pet-settings';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import PetSvgCat from './PetSvgCat';
import type { PupilRegister } from './PetSvgCat';
import styles from './index.less';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const STORAGE_KEY = 'cloud-notes-desk-pet-pos';

type Pos = { left: number; top: number };

const readStoredPos = (): Pos | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Pos;
    if (typeof o.left === 'number' && typeof o.top === 'number') return o;
  } catch {
    /* ignore */
  }
  return null;
};

function PetHappyBurst() {
  return (
    <div className={styles.hearts} aria-hidden>
      <span className={styles.heartA}>♥</span>
      <span className={styles.heartB}>♥</span>
      <span className={styles.sparkA}>✦</span>
    </div>
  );
}

/** 右下角桌宠：可配色、可拖动、位置持久化；登录页不显示 */
const InteractivePet: React.FC = () => {
  const { pathname } = useLocation();
  const [settings, setSettings] = useState<DeskPetSettings>(() =>
    typeof window === 'undefined' ? { ...DEFAULT_DESK_PET_SETTINGS } : loadDeskPetSettings(),
  );
  const pupilRefs = useRef<Array<SVGGElement | null>>([]);
  const watchInputRef = useRef(false);
  const petWrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; origLeft: number; origTop: number } | null>(
    null,
  );

  const petSize = DESK_PET_SIZE_PX[settings.size];
  const petVars = deskPetSettingsCssVars(settings) as React.CSSProperties;

  const registerPupil: PupilRegister = useCallback((index: number) => (el: SVGGElement | null) => {
    pupilRefs.current[index] = el;
  }, []);

  const [active, setActive] = useState(false);
  const [surprised, setSurprised] = useState(false);
  const [sleepy, setSleepy] = useState(false);
  const [watchInput, setWatchInput] = useState(false);
  const [pos, setPos] = useState<Pos>({ left: 80, top: 80 });

  const defaultPos = useCallback((): Pos => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    return {
      left: w - petSize - 16,
      top: h - petSize - 6,
    };
  }, [petSize]);

  const clampPos = useCallback(
    (p: Pos): Pos => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const h = typeof window !== 'undefined' ? window.innerHeight : 800;
      return {
        left: clamp(p.left, 8, w - petSize - 8),
        top: clamp(p.top, 8, h - petSize - 8),
      };
    },
    [petSize],
  );

  useEffect(() => {
    const onChange = () => setSettings(loadDeskPetSettings());
    window.addEventListener(DESK_PET_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(DESK_PET_CHANGED_EVENT, onChange);
  }, []);

  useEffect(() => {
    const p = readStoredPos() ?? defaultPos();
    setPos(clampPos(p));
  }, [clampPos, defaultPos, settings.size]);

  useEffect(() => {
    const onResize = () => setPos((p) => clampPos(p));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clampPos]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
    } catch {
      /* ignore */
    }
  }, [pos]);

  useEffect(() => {
    watchInputRef.current = watchInput;
  }, [watchInput]);

  useEffect(() => {
    let raf = 0;
    let latestX = 0;
    let latestY = 0;
    let hasPointer = false;
    let lastMoveAt = Date.now();
    let prevX = 0;
    let prevY = 0;
    let prevTs = 0;
    let sleepyTimer = 0;
    let surpriseTimer = 0;
    let watchInputTimer = 0;

    const reset = () => {
      hasPointer = false;
      setWatchInput(false);
      for (let i = 0; i < pupilRefs.current.length; i += 1) {
        const pupil = pupilRefs.current[i];
        if (!pupil) {
          continue;
        }
        pupil.setAttribute('transform', 'translate(0 0)');
      }
    };

    const update = () => {
      if (!hasPointer) {
        return;
      }
      const rect = petWrapRef.current?.getBoundingClientRect();
      const headCenterX = rect ? rect.left + rect.width * 0.48 : window.innerWidth - 112;
      const headCenterY = rect ? rect.top + rect.height * 0.38 : window.innerHeight - 170;
      const dx = latestX - headCenterX;
      const dy = latestY - headCenterY;
      const dist = Math.hypot(dx, dy);
      const strength = clamp(1 - dist / 560, 0, 1);
      const inputBiasX = watchInputRef.current ? 1.1 : 0;
      const inputBiasY = watchInputRef.current ? -1.0 : 0;
      const offsetX = clamp(dx / 26, -8, 8) * strength + inputBiasX;
      const offsetY = clamp(dy / 26, -7, 7) * strength + inputBiasY;
      const transform = `translate(${offsetX.toFixed(2)} ${offsetY.toFixed(2)})`;
      pupilRefs.current.forEach((p) => p?.setAttribute('transform', transform));
    };

    const onMove = (event: MouseEvent) => {
      const now = performance.now();
      const dt = Math.max(now - prevTs, 1);
      const speed = Math.hypot(event.clientX - prevX, event.clientY - prevY) / dt;
      prevX = event.clientX;
      prevY = event.clientY;
      prevTs = now;

      if (speed > 1.9) {
        setSurprised(true);
        window.clearTimeout(surpriseTimer);
        surpriseTimer = window.setTimeout(() => {
          setSurprised(false);
        }, 650);
      }

      const target = event.target as HTMLElement | null;
      const isInputLike = !!target?.closest(
        'input, textarea, [contenteditable="true"], .ant-input, .ant-input-affix-wrapper',
      );
      if (isInputLike) {
        setWatchInput(true);
        window.clearTimeout(watchInputTimer);
        watchInputTimer = window.setTimeout(() => {
          setWatchInput(false);
        }, 900);
      }

      lastMoveAt = Date.now();
      setSleepy(false);
      window.clearTimeout(sleepyTimer);
      sleepyTimer = window.setTimeout(() => {
        if (Date.now() - lastMoveAt > 5000) {
          setSleepy(true);
        }
      }, 5200);

      latestX = event.clientX;
      latestY = event.clientY;
      hasPointer = true;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('blur', reset);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(sleepyTimer);
      window.clearTimeout(surpriseTimer);
      window.clearTimeout(watchInputTimer);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('blur', reset);
    };
  }, []);

  useEffect(() => {
    if (!active) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setActive(false);
    }, 900);
    return () => {
      window.clearTimeout(timer);
    };
  }, [active]);

  const onDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origLeft: pos.left,
      origTop: pos.top,
    };
    const onMove = (ev: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = ev.clientX - d.startX;
      const dy = ev.clientY - d.startY;
      setPos(
        clampPos({
          left: d.origLeft + dx,
          top: d.origTop + dy,
        }),
      );
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  if (pathname.startsWith('/user/login')) {
    return null;
  }

  if (!settings.visible) {
    return null;
  }

  return (
    <div className={styles.petLayer} aria-hidden>
      <div
        ref={petWrapRef}
        className={`${styles.petWrap} ${active ? styles.wrapHappy : ''}`}
        style={{
          left: pos.left,
          top: pos.top,
          width: petSize,
          height: petSize,
          ...petVars,
        }}
        data-pet-color={settings.colorHex}
        data-pet-size={settings.size}
        onMouseDown={onDragStart}
        title="拖动到任意位置 · 点击互动 · 右上角「外观与桌宠」可改颜色"
      >
        {active ? <PetHappyBurst /> : null}
        <button
          type="button"
          className={`${styles.petBody} ${active ? styles.active : ''} ${surprised ? styles.surprised : ''} ${sleepy ? styles.sleepy : ''}`}
          onClick={() => setActive(true)}
        >
          <span className={styles.petInner}>
            <PetSvgCat registerPupil={registerPupil} />
          </span>
        </button>
      </div>
    </div>
  );
};

export default InteractivePet;
