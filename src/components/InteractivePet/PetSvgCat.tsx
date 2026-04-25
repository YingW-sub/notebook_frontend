import React from 'react';
import styles from './index.less';

/** 眼球跟随指针：两个瞳孔组的 ref 注册器 */
export type PupilRegister = (index: number) => (el: SVGGElement | null) => void;

const PetSvgCat: React.FC<{ registerPupil: PupilRegister }> = ({ registerPupil }) => (
  <svg viewBox="0 0 280 280" className={styles.petSvg}>
    <ellipse cx="140" cy="258" rx="66" ry="13" className={styles.shadow} />
    <path className={styles.strokeFill} d="M47 89 L79 16 L121 81 Z" />
    <path className={styles.strokeFill} d="M233 89 L201 16 L159 81 Z" />
    <path className={styles.earInner} d="M66 78 L84 35 L111 76 Z" />
    <path className={styles.earInner} d="M214 78 L196 35 L169 76 Z" />
    <ellipse cx="140" cy="108" rx="94" ry="82" className={styles.strokeFill} />
    <path className={styles.patchOrange} d="M48 104 C50 55 98 42 132 53 C120 83 91 113 56 125 Z" />
    <path className={styles.patchDark} d="M231 112 C229 66 196 48 161 56 C168 86 188 108 223 123 Z" />

    <ellipse cx="78" cy="128" rx="22" ry="14" className={styles.cheekBlush} />
    <ellipse cx="202" cy="128" rx="22" ry="14" className={styles.cheekBlush} />

    <circle cx="106" cy="112" r="14" className={styles.eyeBlack} />
    <circle cx="174" cy="112" r="14" className={styles.eyeBlack} />
    <g ref={registerPupil(0)}>
      <circle cx="104" cy="108" r="5.2" className={styles.eyeWhite} />
      <circle cx="98" cy="116" r="3.2" className={styles.eyeWhite} />
    </g>
    <g ref={registerPupil(1)}>
      <circle cx="172" cy="108" r="5.2" className={styles.eyeWhite} />
      <circle cx="166" cy="116" r="3.2" className={styles.eyeWhite} />
    </g>

    <path className={styles.nose} d="M130 134 Q140 126 150 134 Q140 146 130 134 Z" />
    <path className={styles.mouthLine} d="M140 145 C136 156 125 160 114 158" />
    <path className={styles.mouthLine} d="M140 145 C144 156 155 160 166 158" />

    <path className={styles.whisker} d="M85 144 L54 138" />
    <path className={styles.whisker} d="M85 152 L52 154" />
    <path className={styles.whisker} d="M85 160 L57 171" />
    <path className={styles.whisker} d="M195 144 L226 138" />
    <path className={styles.whisker} d="M195 152 L228 154" />
    <path className={styles.whisker} d="M195 160 L223 171" />

    <path
      className={styles.strokeFill}
      d="M96 170 C78 189 70 219 79 244 C86 259 104 261 120 254 C134 248 146 247 160 254 C176 261 194 259 201 244 C210 219 202 189 184 170 Z"
    />
    <path className={styles.patchOrange} d="M172 173 C186 182 197 196 198 214 C186 209 174 200 165 187 Z" />
    <path className={styles.patchDark} d="M87 188 C76 198 73 214 78 230 C90 228 102 219 106 206 Z" />
    <path className={styles.strokeFill} d="M206 212 C241 197 256 218 248 236 C240 254 218 253 203 243 Z" />
    <path className={styles.patchOrange} d="M214 219 C235 212 246 225 242 236 C237 247 223 247 214 239 Z" />
    <path className={styles.strokeFill} d="M117 214 C123 238 126 252 133 253 C140 254 143 239 149 214" />
    <path className={styles.strokeFill} d="M163 214 C157 238 154 252 147 253 C140 254 137 239 131 214" />
  </svg>
);

export default PetSvgCat;
