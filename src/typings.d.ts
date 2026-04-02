declare module 'slash2';
declare module '*.css';
declare module '*.less';
declare module '*.scss';
declare module '*.sass';
declare module '*.svg';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.bmp';
declare module '*.tiff';
declare module 'omit.js';
declare module 'numeral';
declare module '@antv/data-set';
declare module 'mockjs';
declare module 'react-fittext';
declare module 'bizcharts-plugin-slider';

declare const REACT_APP_ENV: 'test' | 'dev' | 'pre' | false;

/** 与页面、ProTable 配合使用的最小类型占位（可按需细化） */
declare namespace API {
  type Token = Record<string, any>;
  type NoteVO = Record<string, any>;
  type NoteDTO = Record<string, any>;
  type NoteQueryDTO = Record<string, any>;
  type LoginLogVO = Record<string, any>;
  type AdminVO = Record<string, any>;
  type DepartmentVO = Record<string, any>;
  type DepartmentQueryDTO = Record<string, any>;
  type DepartmentDTO = Record<string, any>;
  type LoginParams = { userId: string; password: string };
  type NoteImportResult = { title?: string; plainText?: string; sourceType?: string };
  type OnlineUserVO = {
    userCode?: string;
    userName?: string;
    sex?: number;
    enabled?: boolean;
    accessToken?: string;
    browser?: string;
    os?: string;
    department?: string;
    lastAction?: string;
  };
}
