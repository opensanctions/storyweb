import Document, { Html, Head, Main, NextScript } from 'next/document';

export default class StoryWebDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* <meta name="viewport" content="width=device-width, initial-scale=1" /> */}
          <meta name="twitter:site" content="@open_sanctions" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}