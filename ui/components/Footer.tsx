import React from 'react';
import Link from 'next/link';

import styles from '../styles/Footer.module.scss';

export default class Footer extends React.Component {
  render() {
    return (
      <div className={styles.footer}>
        <div className='container section'>
          StoryWeb prototype
        </div>
      </div>
    )
  }
}