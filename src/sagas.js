import fetch from 'isomorphic-fetch'
import _ from 'lodash'

import { call, put, fork, take, cancel, cancelled, all  } from 'redux-saga/effects'

import * as types from './types'
import { receiveCV } from './actions'
 
import moment from 'moment'
import * as widgets from './widgets_parser'

function checkStatus(res) {
  console.log("sagas.checkStatus")

  if (res.status >= 400) {
    let message = `Status: ${res.status}`
    throw new Error(message)
    
  }
  return res.json()
}

export function fetchWidgetsData(uri) {
  console.log("sagas.fetchWidgetsData")
 
  let widgets_base_url = process.env.WIDGETS_URL
  
  const widgetsUrl = `${widgets_base_url}/api/v0.9/people/complete/all.json?uri=${uri}`

  let attempt = fetch(widgetsUrl)
  return attempt.then(res => checkStatus(res))
}


import blankTemplate from './templates/BlankTemplate.docx'
import htmlTemplate from './templates/cv_template.html'

import FileSaver from 'file-saver'

import JSZip from 'jszip'
import JSZipUtils from 'jszip-utils'

function loadFile(url,callback){
  JSZipUtils.getBinaryContent(url,callback)
}
 
export function generateCV(results, uri) {
  console.log("sagas.generateCV")

  try {
    
    loadFile(blankTemplate, function(err,content) {
      if (err) { 
        console.log(err)
      }
    
      var zip = new JSZip(content)
      
      //var data = widgets.convertData(results)
      let widgetsParser = new widgets.WidgetsParser()

      //widgetsParser.parsePublications(results)
      var data = widgetsParser.convert(results)


      console.log("****** tranformed data:******")
      console.log(data)

      var compiled = _.template(htmlTemplate,'imports': {'_': _})
      var template = compiled(data)
      
      zip.file("word/document.html", template) 

      var blob = zip.generate({
          type:"blob",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        }
      ) //Output the document using Data-URI
  
      let index = uri.lastIndexOf("/")
      let personNumber = uri.substr(index+1)
      
      let now = moment().format()
      let fileName = `${personNumber}_${now}.docx`
      
      //console.log(template)
      FileSaver.saveAs(blob, fileName)

    })
  

  } catch (e) {
   console.log(e)
  }

}

export function* fetchCV(action) {
  console.log("sagas.fetchCV")
  const { uri } = action
 
  try {
    const results = yield call(fetchWidgetsData, uri)

    yield put(receiveCV(results))

    yield call(generateCV, results, uri)

  } catch(e) {
    //yield put(cvFailed(e.message))
  } 
}

function* watchForCV() {
  while(true) {
    const action = yield take(types.REQUEST_CV)
    
    console.log("watchForCV")
    console.log(action)
 
    yield fork(fetchCV, action)
  }
}


export default function* root() {
  yield [
    fork(watchForCV)
  ]
}

