import { Button, ButtonGroup } from "@blueprintjs/core";
import { useSearchParams } from "react-router-dom";

import { IListingResponse } from "../types";
import styles from '../styles/util.module.scss';
import { Numeric } from "./util";


type PaginationProps<T> = {
  prefix: string
  response: IListingResponse<T>
}

export default function Pagination<T>({ prefix, response }: PaginationProps<T>) {
  const [params, setParams] = useSearchParams();

  const setOffset = (e: React.MouseEvent<HTMLElement>, newOffset: number) => {
    e.preventDefault();
    const oldParams = Object.fromEntries(params.entries());
    const key = `${prefix}.offset`;
    setParams({ ...oldParams, [key]: newOffset + '' });
  }

  const nextOffset = response.offset + response.limit;
  const upper = Math.min(response.total, nextOffset);
  const hasPrev = response.offset > 0;
  const hasNext = response.total > nextOffset;
  const prevOffset = Math.max(0, response.offset - response.limit)
  return (
    <ButtonGroup fill className={styles.pagination}>
      <Button icon="caret-left" disabled={!hasPrev} onClick={(e) => setOffset(e, prevOffset)} />
      <Button fill disabled minimal>
        {response.offset + 1} - {upper} of <Numeric value={response.total} />
      </Button>
      <Button icon="caret-right" disabled={!hasNext} onClick={(e) => setOffset(e, nextOffset)} />
    </ButtonGroup>
  )
}