import { NonIdealState, NonIdealStateIconSize, Spinner, SpinnerSize } from '@blueprintjs/core';
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ReactNode } from 'react';
import classnames from 'classnames';

import { SPACER } from '..//constants';
import { useFetchOntologyQuery } from '../services/ontology';

import styles from '../styles/util.module.scss';


type ClusterLabelProps = {
  label: string
}

export function ClusterLabel({ label }: ClusterLabelProps) {
  return <span className={styles.ClusterLabel}>{label}</span>;
}

type TagTypeProps = {
  type: string
}

export function TagType({ type }: TagTypeProps) {
  const { data: ontology } = useFetchOntologyQuery();
  const meta = ontology?.cluster_types.find((t) => t.name === type)
  return (
    <span className={styles.tagType} style={{ 'backgroundColor': meta?.color }}>
      {meta?.label || type}
    </span>
  );
}

type LinkTypeProps = {
  type: string
}

export function LinkType({ type }: LinkTypeProps) {
  const { data: ontology } = useFetchOntologyQuery();
  const meta = ontology?.link_types.find((t) => t.name === type)
  return <span className={classnames(styles[type], styles.linkType)}>{meta?.label || type}</span>;
}

type NumericProps = {
  value?: number | null
}

export function Numeric({ value }: NumericProps) {
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
  if (value === undefined || value === null) {
    return null;
  }
  const fmt = new Intl.NumberFormat('en-US');
  return <>{fmt.format(value)}</>;
}


type SpacedListProps = {
  values: Array<ReactNode>
}

export function SpacedList({ values }: SpacedListProps) {
  if (values.length === 0) {
    return null;
  }
  return (
    <>
      {values
        .map<React.ReactNode>((t, idx) => <span key={idx}>{t}</span>)
        .reduce((prev, curr, idx) => [prev, <Spacer key={`spacer-${idx}`} />, curr])}
    </>
  )
}

export function Spacer() {
  return (
    <span className={styles.spacer}>{SPACER}</span>
  )
}


export function SectionLoading() {
  return (
    <NonIdealState
      icon={<Spinner size={SpinnerSize.STANDARD} />}
      iconSize={NonIdealStateIconSize.STANDARD}
    />
  )
}

type ErrorSectionProps = {
  title: string
  description?: string
}

export function ErrorSection({ title, description }: ErrorSectionProps) {
  return (
    <NonIdealState
      title={title}
      description={description}
      icon="warning-sign"
      iconSize={NonIdealStateIconSize.STANDARD}
    />
  )
}

export function ScreenLoading() {
  return (
    <NonIdealState
      title="Loading..."
      icon={<Spinner size={SpinnerSize.LARGE} />}
      iconSize={NonIdealStateIconSize.STANDARD}
    />
  )
}


export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
