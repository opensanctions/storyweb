import type { AppProps } from 'next/app'

import '../styles/globals.scss'


function StorywebApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

export default StorywebApp
