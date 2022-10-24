import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { HotkeysProvider } from "@blueprintjs/core";

import Navbar from './Navbar';
import Footer from './Footer';

import styles from '../styles/Layout.module.scss';
import { SITE } from '../lib/constants';

type LayoutBaseProps = {
  title?: string,
  description?: string | null
}

export default function Layout({ title, description, children }: React.PropsWithChildren<LayoutBaseProps>) {
  const router = useRouter();
  // const url = `${BASE_URL}${router.asPath}`;
  const fullTitle = `${title} - ${SITE}`
  return (
    <>
      <Head>
        {title && (
          <>
            <title>{fullTitle}</title>
            <meta property="og:title" content={title} />
            <meta property="twitter:title" content={title} />
          </>
        )}
        <link rel="apple-touch-icon" sizes="180x180" href="/static/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/static/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/static/favicon-16x16.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:creator" content="@pudo" />
        {!!description && (
          <>
            <meta property="og:description" content={description.trim()} />
            <meta name="description" content={description.trim()} />
          </>
        )}
        <meta name="og:site" content={SITE} />
      </Head>
      <HotkeysProvider>
        <>
          <div className={styles.page}>
            <Navbar />
            <div className={styles.content}>
              {children}
            </div>
          </div>
          <Footer />
        </>
      </HotkeysProvider>
    </>
  )
}
