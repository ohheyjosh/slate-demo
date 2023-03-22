import '../styles/globals.css'
import type { AppProps } from 'next/app'

function SlateDemo({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

export default SlateDemo;
