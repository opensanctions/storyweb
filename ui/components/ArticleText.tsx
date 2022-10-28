import { Drawer, DrawerSize } from "@blueprintjs/core"
import { SyntheticEvent } from "react"
import { IArticle } from "../lib/types"

import styles from '../styles/Article.module.scss'

type ArticleTextProps = {
  text: string
  tags: string[][]
}

export default function ArticleText({ text, tags }: ArticleTextProps) {
  let html = text;
  tags.forEach((forms, index) => {
    const alternatives = forms.map(f => f.trim().replace(' ', '\s')).join('|');
    const altRx = new RegExp(`(${alternatives})`, 'muig')
    console.log(altRx)
    html = html.replaceAll(altRx, (m) => `<span class="markup">${m}</span>`);
  })
  html = html.replaceAll(/\n/g, '<br />\n');
  return (
    <p className={styles.articleText} dangerouslySetInnerHTML={{ __html: html }} />
  )
}