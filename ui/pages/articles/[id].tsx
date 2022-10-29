import type { GetServerSidePropsContext } from 'next'

import Layout from '../../components/Layout'
import { IArticleDetails } from '../../lib/types';

import { Spacer } from '../../components/util';
import { fetchJson } from '../../lib/data';
import ArticleText from '../../components/ArticleText';

interface ArticleViewProps {
  article: IArticleDetails
}

export default function ArticleView({ article }: ArticleViewProps) {
  return (
    <Layout title={article.title}>
      <h1>
        {article.title}
      </h1>
      <p>
        Site: {article.site} <Spacer />
        <a href={article.url}>{article.url}</a>
      </p>
      <ArticleText text={article.text} tags={[['and', 'or'], ['if', 'when']]} />
    </Layout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const articleId = context.params?.id as string;
  const article = await fetchJson<IArticleDetails>(`/articles/${articleId}`);

  // const clusters = `/clusters/${cluster.id}/similar`;
  // const similar = await fetchJson<IListingResponse<ICluster>>(similarPath);
  return {
    props: { article },
  }
}
