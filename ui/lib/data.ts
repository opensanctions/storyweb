import queryString from 'query-string';

import { API_URL } from "./constants";


export async function fetchJson<T>(path: string, query: any = undefined): Promise<T> {
  const apiUrl = queryString.stringifyUrl({
    'url': `${API_URL}${path}`,
    'query': query
  })
  const data = await fetch(apiUrl);
  if (!data.ok) {
    throw Error(`Backend error (${data.status})`);
  }
  return await data.json() as T;
}