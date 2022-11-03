import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar, Alignment, Icon } from '@blueprintjs/core';


export default function NavbarSection() {
  return (
    <Navbar>
      <div className='page-container'>
        <Navbar.Group align={Alignment.LEFT}>
          <Navbar.Heading>
            <Link to="/">StoryWeb</Link>
          </Navbar.Heading>
          <Navbar.Divider />
          <Link to="/clusters" role="button" className="bp4-minimal bp4-button">
            <Icon icon="people" />
            <span className="bp4-button-text">Entities</span>
          </Link>
          <Link to="/articles" role="button" className="bp4-minimal bp4-button">
            <Icon icon="document" />
            <span className="bp4-button-text">Articles</span>
          </Link>
        </Navbar.Group>
      </div>
    </Navbar>
  )
}