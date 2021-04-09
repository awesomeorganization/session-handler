/* eslint-disable node/no-unsupported-features/es-syntax */

import { http } from '@awesomeorganization/servers'
import { sessionHandler } from '../main.js'
import { strictEqual } from 'assert'
import undici from 'undici'

const data = (body) => {
  return new Promise((resolve) => {
    let chunks = ''
    body.setEncoding('utf8')
    body.on('data', (chunk) => {
      chunks += chunk
    })
    body.once('end', () => {
      resolve(chunks)
    })
  })
}

const test = async () => {
  const { handle } = await sessionHandler()
  http({
    listenOptions: {
      host: '127.0.0.1',
      port: 0,
    },
    async onListening() {
      const { address, port } = this.address()
      const client = new undici.Client(`http://${address}:${port}`)
      for (let cookie, counter = 0; counter !== 10; counter++) {
        const { body, headers } = await client.request({
          headers: {
            cookie,
          },
          method: 'GET',
          path: '/',
        })
        if ('set-cookie' in headers) {
          cookie = headers['set-cookie'].substring(0, headers['set-cookie'].indexOf(';'))
        }
        strictEqual(await data(body), counter.toString())
      }
      {
        const { body } = await client.request({
          method: 'GET',
          path: '/',
        })
        strictEqual(await data(body), '0')
      }
      await client.close()
      this.close()
    },
    async onRequest(request, response) {
      const { storage } = await handle({
        request,
        response,
      })
      const counter = storage.get('counter') ?? 0
      storage.set('counter', counter + 1)
      response.end(counter.toString())
    },
  })
}

test()
