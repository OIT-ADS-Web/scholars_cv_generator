import React, { Component } from 'react'
import { Provider } from 'react-redux'

import { sagaMiddleware, configureStoreSaga } from './configureStore'

const store = configureStoreSaga()

import rootSaga from './sagas'

store.runSaga = sagaMiddleware.run
store.runSaga(rootSaga)

import ScholarsCVApp from './ScholarsCVApp'

export default class ScholarsCV extends Component {
  
  constructor(props) {
    super(props)
  }

  
  render() {
    return (
      <Provider store={store}>
          <ScholarsCVApp />
      </Provider>
    )        
  }

}

