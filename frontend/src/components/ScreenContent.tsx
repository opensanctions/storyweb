import { Card, Elevation } from '@blueprintjs/core';

import styles from '../styles/util.module.scss';

type ScreenContentProps = {
  children?: React.ReactNode
}

export default function ScreenContent({ children }: ScreenContentProps) {
  return (
    <Card elevation={Elevation.ONE} className={styles.screenContent}>
      {children}
    </Card>
  )
}