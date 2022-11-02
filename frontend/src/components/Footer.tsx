import React from 'react';

import styles from '../styles/Footer.module.scss';

export default class Footer extends React.Component {
  render() {
    return (
      <div className={styles.footer}>
        <div className='page-container'>
          StoryWeb prototype
        </div>
      </div>
    )
  }
}