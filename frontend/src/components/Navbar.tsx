import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar, Alignment, AnchorButton } from '@blueprintjs/core';


export default function NavbarSection() {
  return (
    <Navbar>
      <div className='page-container'>
        <Navbar.Group align={Alignment.LEFT}>
          <Navbar.Heading>
            <Link to="/">StoryWeb</Link>
          </Navbar.Heading>
          <Navbar.Divider />
          <Link to="/clusters">
            <AnchorButton className="bp4-minimal" icon="people" text="Entities" />
          </Link>
          <Link to="/articles">
            <AnchorButton className="bp4-minimal" icon="document" text="Articles" />
          </Link>
        </Navbar.Group>
      </div>
    </Navbar>
  )
}