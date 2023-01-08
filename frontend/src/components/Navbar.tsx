import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar, Alignment, Icon, Button } from '@blueprintjs/core';
import SettingsDialog from './SettingsDialog';


export default function NavbarSection() {
  const [showSettings, setShowSettings] = useState(false);
  return (
    <Navbar className='bp4-dark'>
      <div className='page-container'>
        <Navbar.Group align={Alignment.LEFT}>
          <Navbar.Heading>
            <Link to="/">
              StoryWeb
            </Link>
          </Navbar.Heading>
          <Navbar.Divider />
          <Link to="/" role="button" className="bp4-minimal bp4-button">
            <Icon icon="projects" />
            <span className="bp4-button-text">Stories</span>
          </Link>
          <Link to="/clusters" role="button" className="bp4-minimal bp4-button">
            <Icon icon="people" />
            <span className="bp4-button-text">Entities</span>
          </Link>
          <Link to="/articles" role="button" className="bp4-minimal bp4-button">
            <Icon icon="document" />
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