import { Outlet } from "react-router-dom";
import classnames from "classnames";
import { HotkeyConfig, HotkeysTarget2, HotkeysProvider } from '@blueprintjs/core';
import Helmet from "react-helmet";

import { ScreenLoading, ScrollToTop } from "../components/util";
import { SITE } from "../constants";
import { useFetchOntologyQuery } from "../services/ontology";
import Footer from "../components/Footer";
import NavbarSection from "../components/Navbar";

import styles from "../styles/Layout.module.scss";

export default function Layout() {
  const { data: ontology, error: ontologyError } = useFetchOntologyQuery();

  if (ontology === undefined) {
    return <ScreenLoading />
  }

  const appHotkeys: HotkeyConfig[] = [
    {
      combo: "/",
      global: true,
      label: "Search entity",
      onKeyDown: () => alert('tbd :)'),
    },
  ];

  return (
    <>
      <Helmet>
        {/* <link rel="apple-touch-icon" sizes="180x180" href="/static/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/static/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/static/favicon-16x16.png" /> */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:creator" content="@pudo" />
        <meta name="og:site" content={SITE} />
      </Helmet>
      <HotkeysProvider>
        <div className={styles.page}>
          <NavbarSection />
          <ScrollToTop />
          <HotkeysTarget2 hotkeys={appHotkeys}>
            <div className={classnames(styles.content, 'page-container')}>
              <Outlet />
            </div>
          </HotkeysTarget2>
        </div>
      </HotkeysProvider>
      <Footer />
    </>
  )
}
