import * as types from './types'

export function requestCV(uri,template,format) {
  console.log("actions.requestCV")
  // NOTE: seems redundant to send in uri
  // when it's already in state
  return {
    uri: uri,
    template: template,
    format: format,
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

export function setUri(uri) {
  return {
   type: types.SET_URI,
   uri: uri
  }
}

export function setTemplate(template) {
  return {
   type: types.SET_TEMPLATE,
   template: template
  }
}

export function setFormat(format) {
  return {
   type: types.SET_FORMAT,
   format: format
  }
}

export function setHtml(html) {
  return {
   type: types.SET_HTML,
   html: html
  }
}

export default {
  requestCV,
  receiveCV,
  setUri,
  setTemplate,
  setFormat,
  setHtml
} 

