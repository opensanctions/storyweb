import React, { useState } from 'react';
import classnames from 'classnames';
import { Link } from 'react-router-dom';
import { Navbar, Alignment, Icon, Button } from '@blueprintjs/core';
import SettingsDialog from './SettingsDialog';
import { ARTICLE_ICON, CLUSTER_ICON, SITE, STORY_ICON } from '../constants';

import styles from "../styles/Navbar.module.scss";

export default function NavbarSection() {
  const [showSettings, setShowSettings] = useState(false);
  return (
    // 'bp4-dark', 
    <Navbar className={classnames(styles.navContainered)}>
      <div className='page-container'>
        <Navbar.Group align={Alignment.LEFT}>
          <Navbar.Heading>
            <Link to="/">{SITE}</Link>
          </Navbar.Heading>
          <Navbar.Divider />
          <Link to="/" role="button" className="bp4-minimal bp4-button">
            <Icon icon={STORY_ICON} />
            <span className="bp4-button-text">Stories</span>
          </Link>
          <Link to="/clusters" role="button" className="bp4-minimal bp4-button">
            <Icon icon={CLUSTER_ICON} />
            <span className="bp4-button-text">Entities</span>
          </Link>
          <Link to="/articles" role="button" className="bp4-minimal bp4-button">
            <Icon icon={ARTICLE_ICON} />
            <span className="bp4-button-text">Articles</span>
          </Link>
        </Navbar.Group>
        <Navbar.Group align={Alignment.RIGHT}>
          <Button minimal icon="cog" onClick={() => setShowSettings(true)}>Settings</Button>
          <SettingsDialog isOpen={showSettings} onClose={() => setShowSettings(false)} />
        </Navbar.Group>
      </div>
    </Navbar>
  )
}