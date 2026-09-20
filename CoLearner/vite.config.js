import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const configured = loadEnv(mode, process.cwd(), 'VITE_')
  const siteUrl = configured.VITE_SITE_URL || process.env.RENDER_EXTERNAL_URL
  let origin
  if (siteUrl) {
    const site = new URL(siteUrl)
    if (
      !['http:', 'https:'].includes(site.protocol) ||
      (mode === 'production' && site.protocol !== 'https:') ||
      site.username ||
      site.password ||
      site.pathname !== '/' ||
      site.search ||
      site.hash
    )
      throw new Error(
        'VITE_SITE_URL must be the public HTTPS origin, without a path or credentials.',
      )
    origin = site.origin
  }
  return {
    plugins: [
      react(),
      {
        name: 'colearn-site-metadata',
        transformIndexHtml() {
          // Until the deployment domain is known, do not advertise an assumed domain.
          return origin
            ? [
                {
                  tag: 'link',
                  attrs: { rel: 'canonical', href: `${origin}/` },
                  injectTo: 'head',
                },
                {
                  tag: 'meta',
                  attrs: { property: 'og:url', content: `${origin}/` },
                  injectTo: 'head',
                },
                {
                  tag: 'meta',
                  attrs: {
                    property: 'og:image',
                    content: `${origin}/og-image.png`,
                  },
                  injectTo: 'head',
                },
                {
                  tag: 'meta',
                  attrs: {
                    name: 'twitter:image',
                    content: `${origin}/og-image.png`,
                  },
                  injectTo: 'head',
                },
              ]
            : []
        },
      },
    ],
  }
})
