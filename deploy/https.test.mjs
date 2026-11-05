import assert from 'node:assert/strict'
import test from 'node:test'

const address = '13.140.206.57'

for (const path of ['/', '/healthz', '/creator/example?x=1&x=2', '/assets/missing.js', '/api/https-probe?x=1']) {
  test(`HTTP redirects ${path} to the canonical HTTPS origin`, async () => {
    const response = await fetch(`http://${address}${path}`, {
      redirect: 'manual',
      headers: { Host: 'vmi3724221.contaboserver.net' },
    })
    assert.equal(response.status, 308)
    assert.equal(response.headers.get('location'), `https://${address}${path}`)
  })
}

test('HTTP POST to API redirects without processing the request', async () => {
  const response = await fetch(`http://${address}/api/https-probe?x=1`, {
    method: 'POST',
    redirect: 'manual',
  })
  assert.equal(response.status, 308)
  assert.equal(response.headers.get('location'), `https://${address}/api/https-probe?x=1`)
})

test('HTTP missing ACME token returns 404 rather than redirect or SPA', async () => {
  const response = await fetch(`http://${address}/.well-known/acme-challenge/https-only-missing-probe`, {
    redirect: 'manual',
  })
  assert.equal(response.status, 404)
  assert.equal(response.headers.get('location'), null)
})

for (const path of ['/healthz', '/creator/example']) {
  test(`trusted HTTPS serves ${path}`, async () => {
    const response = await fetch(`https://${address}${path}`)
    assert.equal(response.status, 200)
  })
}

test('HTTPS API reaches backend rather than SPA fallback', async () => {
  const response = await fetch(`https://${address}/api/https-probe`)
  assert.equal(response.status, 404)
  assert.match(response.headers.get('content-type'), /application\/json/)
  const body = await response.json()
  assert.equal(body.status, 404)
  assert.equal(body.path, '/api/https-probe')
})
