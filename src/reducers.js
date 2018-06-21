import * as types from './types'

function cvReducer(cv = { isFetching: false, results: {}, uri: "", template: "", format: ""}, action) {
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
  case types.SET_URI:
    
    return { ...cv,
     uri: action.uri
  } 
  case types.SET_TEMPLATE:

    return { ...cv,
      template: action.template
  }
  case types.SET_FORMAT:

    return { ...cv,
      format: action.format
  }
  case types.SET_HTML:
    return { ...cv,
    html: action.html
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


