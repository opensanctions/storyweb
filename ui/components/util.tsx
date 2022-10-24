import styles from '../styles/util.module.scss';

type TagLabelProps = {
  label: string
}

export function TagLabel({ label }: TagLabelProps) {
  return <span className={styles.tagLabel}>{label}</span>;
}

type TagCategoryProps = {
  category: string
}

export function TagCategory({ category }: TagCategoryProps) {
  return <span className={styles.tagCategory}>{category}</span>;
}