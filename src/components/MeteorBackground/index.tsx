import React from 'react';
import styles from './index.less';

/** 全屏浅色静态背景，pointer-events: none，不阻挡点击 */
const MeteorBackground: React.FC = () => {
  return <div className={styles.wrap} aria-hidden />;
};

export default MeteorBackground;
