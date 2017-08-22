import * as types from './types'

function cvReducer(cv = { isFetching: false, results: {}}, action) {
  console.log("****cvReducer*****")

  switch (action.type) {

  case types.REQUEST_CV:
    
    return { ...cv, 
      isFetching: true,
      results: action.results,
      lastUpdated: action.requestedAt
  }
  case types.RECEIVE_CV:
    
    return { ...cv, 
      isFetching: false,
      results: action.results,
      lastUpdated: action.receivedAt
  }
  default:
    return cv;
  }
}


import { combineReducers } from 'redux'

const mainReducer = combineReducers({
  cv: cvReducer
})

export default {
  mainReducer,
  cvReducer
}


