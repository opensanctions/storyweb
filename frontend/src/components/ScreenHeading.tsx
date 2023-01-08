import styles from '../styles/util.module.scss';

type ScreenHeadingProps = {
  title: React.ReactNode
  children?: React.ReactNode
}

export default function ScreenHeading({ title, children }: ScreenHeadingProps) {

  return (
    <>
      {!!children && (
        <div className={styles.headingActions}>
          {children}
        </div>
      )}
      <h1>{title}</h1>
    </>
  )
}