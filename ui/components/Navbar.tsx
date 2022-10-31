import React from 'react';
import Link from 'next/link';
import { Navbar, Alignment, AnchorButton } from '@blueprintjs/core';

export default function NavbarSection() {
  return (
    <Navbar>
      <div className='page-container'>
        <Navbar.Group align={Alignment.LEFT}>
          <Navbar.Heading>
            <Link href="/">StoryWeb</Link>
          </Navbar.Heading>
          <Navbar.Divider />
          <Link passHref href="/clusters">
            <AnchorButton className="bp4-minimal" icon="people" text="Entities" />
          </Link>
          <Link passHref href="/articles">
            <AnchorButton className="bp4-minimal" icon="document" text="Articles" />
          </Link>
        </Navbar.Group>
      </div>
    </Navbar>
  )
}