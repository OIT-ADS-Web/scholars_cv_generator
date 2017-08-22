import * as types from './types'

export function requestCV() {
  console.log("actions.requestCV")

  return {
    type: types.REQUEST_CV,
    results: {},
    isFetching: true,
    requestedAt: Date.now()
  }
}

export function receiveCV(json) {
  console.log("actions.receiveCV")

  return {
    type: types.RECEIVE_CV,
    results: json,
    isFetching: false,
    receivedAt: Date.now()
  }
}

export default {
  requestCV,
  receiveCV,
} 

