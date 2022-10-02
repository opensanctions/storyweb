import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';

import styles from '../styles/Navbar.module.scss';


export default function NavbarSection() {
  return (
    <Navbar bg="light" expand="lg" className={styles.navbar}>
      <Container>
        <Link href="/" passHref>
          <Navbar.Brand>
            Storyweb
          </Navbar.Brand>
        </Link>
        <Navbar.Toggle />
        <Navbar.Collapse className="justify-content-end">
          <Nav className="justify-content-end">
            <Link href="/tags/" passHref>
              <Nav.Link>Tags</Nav.Link>
            </Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar >
  )
}