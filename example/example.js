/* eslint-disable node/no-unsupported-features/es-syntax */

import { http } from '@awesomeorganization/servers'
import { sessionHandler } from '@awesomeorganization/session-handler'

const example = async () => {
  const sessionMiddleware = await sessionHandler()
  http({
    listenOptions: {
      host: '127.0.0.1',
      port: 3000,
    },
    async onRequest(request, response) {
      const { id, storage } = await sessionMiddleware.handle({
        request,
        response,
      })
      const counter = storage.get('counter') ?? 0
      storage.set('counter', counter + 1)
      response.end(`Hi ${id}! you have visited this page ${counter} times`)
    },
  })
  // TRY
  // http://127.0.0.1:3000/
}

example()
