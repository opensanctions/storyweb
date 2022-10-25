import type { GetServerSidePropsContext } from 'next'
import { HTMLTable } from '@blueprintjs/core';
import Link from 'next/link';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';

import Layout from '../../components/Layout'
import { IArticleListingResponse, IArticleTagListingResponse, ISiteListingResponse } from '../../lib/types';
import { getTagLink } from '../../lib/util';
import { fetchJson } from '../../lib/data';

interface TagsProps {
  response: IArticleListingResponse,
  query: string,
  site: string,
  sites: string[]
}

export default function ArticleIndex({ response, query, site, sites }: TagsProps) {
  return (
    <Layout title="Articles">
      <Form>
        <Row className="align-items-center">
          <Col>
            <Form.Label htmlFor="q" visuallyHidden>
              Search
            </Form.Label>
            <Form.Control
              id="q"
              name="q"
              defaultValue={query}
              placeholder="Search in articles..."
            />
          </Col>
          <Col xs="auto">
            <InputGroup>
              <InputGroup.Text>
                Source site
              </InputGroup.Text>
              <Form.Select id="site" name="site" defaultValue={site}>
                <option value="">(all sites)</option>
                {sites.map((s) =>
                  <option key={s} value={s}>{s}</option>
                )}
              </Form.Select>
            </InputGroup>
          </Col>
          <Col xs="auto">
            <Button type="submit" id="submit">
              Filter
            </Button>
          </Col>
        </Row>
      </Form>
      <HTMLTable condensed bordered className="wide">
        <thead>
          <tr>
            <th>Title</th>
            <th>Site</th>
            <th className="numeric">Entities</th>
          </tr>
        </thead>
        <tbody>
          {response.results.map((article) => (
            <tr key={article.id}>
              <td>{article.title}</td>
              <td>
                {article.site}
              </td>
              <td className="numeric">
                {article.tags_count}
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
  const params = {
    ...context.query,
    sort: 'tags_count:desc'
  }
  const data = await fetchJson<IArticleListingResponse>('/articles', params);
  const sitesData = await fetchJson<ISiteListingResponse>('/sites');
  const sites = sitesData.results.map((s) => s.site);

  return {
    props: { response: data, query, site, sites },
  }
}
