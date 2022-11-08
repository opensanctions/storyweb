import { NonIdealState, NonIdealStateIconSize, Spinner, SpinnerSize } from '@blueprintjs/core';
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ReactNode } from 'react';

import { SPACER } from '..//constants';
import { useFetchOntologyQuery } from '../services/ontology';
import styles from '../styles/util.module.scss';


type TagLabelProps = {
  label: string
}

export function TagLabel({ label }: TagLabelProps) {
  return <span className={styles.tagLabel}>{label}</span>;
}

type TagTypeProps = {
  type: string
}

export function TagType({ type }: TagTypeProps) {
  const { data: ontology } = useFetchOntologyQuery();
  const meta = ontology?.cluster_types.find((t) => t.name === type)
  return <span className={styles.tagType}>{meta?.label || type}</span>;
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
