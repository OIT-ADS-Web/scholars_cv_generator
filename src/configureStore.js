import { createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from 'redux-saga'
import { createLogger } from 'redux-logger'

const sagaMiddleware = createSagaMiddleware()
const loggerMiddleware = createLogger()

// https://github.com/evgenyrodionov/redux-logger#user-content-log-only-in-development
let middlewares = [sagaMiddleware]

if (process.env.NODE_ENV != 'production') {
  middlewares.push(loggerMiddleware)
}

const createStoreWithMiddleware = applyMiddleware(
  ...middlewares
)(createStore)

const initialState = {}

import reducers from './reducers'

export function configureStoreSaga(initialState = initialState) {
  return createStoreWithMiddleware(reducers.mainReducer, initialState)
}

export { sagaMiddleware }

