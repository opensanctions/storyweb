import type { GetServerSidePropsContext } from 'next'
import classnames from 'classnames';
import { Button, Classes, ControlGroup, HTMLTable } from '@blueprintjs/core';
import Link from 'next/link';

import Layout from '../../components/Layout'
import { IListingResponse, ISite, ICluster } from '../../lib/types';
import { fetchJson } from '../../lib/data';
import { getClusterLink } from '../../lib/util';

interface TagsProps {
  response: IListingResponse<ICluster>,
  query: string,
  site: string,
  sites: string[]
}

export default function ClusterIndex({ response, query, site, sites }: TagsProps) {
  return (
    <Layout title="Entities">
      <section className="section">
        <form method="GET">
          <ControlGroup fill>
            <input
              className={classnames(Classes.INPUT, Classes.FILL)}
              defaultValue={query}
              placeholder="Search entities..."
              name="q"
            />
            <Button type="submit">Search</Button>
          </ControlGroup>
        </form>
      </section>
      <HTMLTable condensed bordered className="wide">
        <thead>
          <tr>
            <th>Label</th>
            <th>Category</th>
            <th>Articles</th>
          </tr>
        </thead>
        <tbody>
          {response.results.map((tag) => (
            <tr>
              <td>
                <Link href={getClusterLink(tag)}>{tag.label}</Link>
              </td>
              <td><code>{tag.category}</code></td>
              <td>
                {tag.articles}
              </td>
            </tr>
          ))}
        </tbody>
      </HTMLTable>
    </Layout>
  )
}


export async function getServerSideProps(context: GetServerSidePropsContext) {
  const query = '' + (context.query.q || '');
  const site = '' + (context.query.site || '');
  const data = await fetchJson<IListingResponse<ICluster>>('/clusters', context.query);
  const sitesData = await fetchJson<IListingResponse<ISite>>('/sites');
  const sites = sitesData.results.map((s) => s.site);

  return {
    props: { response: data, query, site, sites },
  }
}
