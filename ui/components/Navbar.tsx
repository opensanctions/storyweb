import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Navbar, Alignment, AnchorButton } from '@blueprintjs/core';

import styles from '../styles/Navbar.module.scss';


export default function NavbarSection() {
  return (
    <Navbar>
      <div className='container'>
        <Navbar.Group align={Alignment.LEFT}>
          <Navbar.Heading>StoryWeb</Navbar.Heading>
          <Navbar.Divider />
          <AnchorButton className="bp4-minimal" icon="home" text="Home" href="/" />
          <AnchorButton className="bp4-minimal" icon="document" text="Tags" href="/tags" />
        </Navbar.Group>
      </div>
    </Navbar>
  )
}