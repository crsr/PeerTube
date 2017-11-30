/* tslint:disable:no-unused-expression */

import 'mocha'
import * as chai from 'chai'
import * as request from 'supertest'
const expect = chai.expect

import {
  ServerInfo,
  flushTests,
  runServer,
  loginAndGetAccessToken,
  uploadVideo,
  getVideosList
} from './utils'

describe('Test a client controllers', function () {
  let server: ServerInfo

  before(async function () {
    this.timeout(120000)

    await flushTests()

    server = await runServer(1)
    server.accessToken = await loginAndGetAccessToken(server)

    const videoAttributes = {
      name: 'my super name for server 1',
      description: 'my super description for server 1'
    }
    await uploadVideo(server.url, server.accessToken, videoAttributes)

    const res = await getVideosList(server.url)
    const videos = res.body.data

    expect(videos.length).to.equal(1)

    server.video = videos[0]
  })

  it('Should have valid Open Graph tags on the watch page with video id', async function () {
    const res = await request(server.url)
      .get('/videos/watch/' + server.video.id)
      .set('Accept', 'text/html')
      .expect(200)

    expect(res.text).to.contain('<meta property="og:title" content="my super name for server 1" />')
    expect(res.text).to.contain('<meta property="og:description" content="my super description for server 1" />')
  })

  it('Should have valid Open Graph tags on the watch page with video uuid', async function () {
    const res = await request(server.url)
      .get('/videos/watch/' + server.video.uuid)
      .set('Accept', 'text/html')
      .expect(200)

    expect(res.text).to.contain('<meta property="og:title" content="my super name for server 1" />')
    expect(res.text).to.contain('<meta property="og:description" content="my super description for server 1" />')
  })

  it('Should have valid oEmbed discovery tags', async function () {
    const path = '/videos/watch/' + server.video.uuid
    const res = await request(server.url)
      .get(path)
      .set('Accept', 'text/html')
      .expect(200)

    const expectedLink = '<link rel="alternate" type="application/json+oembed" href="http://localhost:9001/services/oembed?' +
      `url=http%3A%2F%2Flocalhost%3A9001%2Fvideos%2Fwatch%2F${server.video.uuid}" ` +
      `title="${server.video.name}" />`

    expect(res.text).to.contain(expectedLink)
  })

  after(async function () {
    process.kill(-server.app.pid)

    // Keep the logs if the test failed
    if (this['ok']) {
      await flushTests()
    }
  })
})
