import type { GetServerSidePropsContext } from 'next'
import { HTMLTable } from '@blueprintjs/core';
import Link from 'next/link';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';

import Layout from '../../components/Layout'
import { IListingResponse, IArticleTag, ISite } from '../../lib/types';
import { getTagLink } from '../../lib/util';
import { fetchJson } from '../../lib/data';

interface TagsProps {
  response: IListingResponse<IArticleTag>,
  query: string,
  site: string,
  sites: string[]
}

export default function Tags({ response, query, site, sites }: TagsProps) {
  return (
    <Layout title="Tags listing">
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
              placeholder="Search in tagged entity names..."
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
                  <option value={s}>{s}</option>
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
            <th>Count</th>
            <th>Tag</th>
            <th>Category</th>
            <th>Source</th>
            <th>Site</th>
          </tr>
        </thead>
        <tbody>
          {response.results.map((tag) => (
            <tr>
              <td>{tag.count}</td>
              <td>
                <Link href={getTagLink(tag)}>{tag.label}</Link>
              </td>
              <td><code>{tag.category}</code></td>
              <td>
                <a target="_blank" href={tag.article.url}>{tag.article.title}</a>
              </td>
              <td>
                {tag.article.site}
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
  const data = await fetchJson<IListingResponse<IArticleTag>>('/tags', context.query);
  const sitesData = await fetchJson<IListingResponse<ISite>>('/sites');
  const sites = sitesData.results.map((s) => s.site);

  return {
    props: { response: data, query, site, sites },
  }
}
