import classnames from 'classnames';

import styles from '../styles/Article.module.scss'

const CLASSES = ['markup1', 'markup2', 'markup3', 'markup4', 'markup5']

type ArticleTextProps = {
  text: string
  tags: string[][]
}

function cleanName(text: string): string {
  return text.trim().replace(' ', '\\s')
  // https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex:
  // function escapeRegExp(string) {
  //   return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  // }
}

function checkName(text: string): boolean {
  if (text === undefined || text === null || text.length === 0) {
    return false
  }
  try {
    new RegExp(text, 'muig')
    return true;
  } catch {
    return false
  }
}

export default function ArticleText({ text, tags }: ArticleTextProps) {
  let html = text;
  tags.forEach((forms, index) => {
    const alternatives = forms.map(cleanName).filter(checkName).join('|');
    const altRx = new RegExp(`(${alternatives})`, 'muig')
    const clazz = CLASSES[index % CLASSES.length];
    html = html.replaceAll(altRx, (m) => `<span class="markup ${clazz}">${m}</span>`);
  })
  // html = html.replaceAll(/\n/g, '<br />\n');
  const paragraphs = html.split('\n').filter((p) => p.trim().length > 1);
  const paraHtml = paragraphs.join('</p><p>')

  return (
    <div className="bp4-card">
      <p className={classnames('bp4-running-text', styles.articleText)} dangerouslySetInnerHTML={{ __html: `<p>${paraHtml}</p>` }} />
    </div>
  )
}