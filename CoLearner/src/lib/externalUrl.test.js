import test from 'node:test'
import assert from 'node:assert/strict'
import { externalUrl } from './externalUrl.js'
test('Profile links preserve the supplied user URL and reject unsafe/empty links', () => {
  for (const url of [
    'https://github.com/alice',
    'https://linkedin.com/in/bob',
    'https://portfolio.example/work?project=1',
    'http://example.com',
  ])
    assert.equal(externalUrl(url), url)
  for (const url of [
    null,
    '',
    ' ',
    '/somewhere',
    'javascript:alert(1)',
    'data:text/html,test',
    'https://name:password@example.com',
  ])
    assert.equal(externalUrl(url), null)
})
