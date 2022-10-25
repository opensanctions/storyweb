import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Navbar, Alignment, AnchorButton } from '@blueprintjs/core';

import styles from '../styles/Navbar.module.scss';


export default function NavbarSection() {
  return (
    <Navbar>
      <div className='page-container'>
        <Navbar.Group align={Alignment.LEFT}>
          <Navbar.Heading>
            <Link href="/">StoryWeb</Link>
          </Navbar.Heading>
          <Navbar.Divider />
          <Link passHref href="/tags">
            <AnchorButton className="bp4-minimal" icon="people" text="Tags" />
          </Link>
          <Link passHref href="/articles">
            <AnchorButton className="bp4-minimal" icon="document" text="Articles" />
          </Link>
        </Navbar.Group>
      </div>
    </Navbar>
  )
}