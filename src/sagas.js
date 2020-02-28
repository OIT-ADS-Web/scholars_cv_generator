import fetch from 'isomorphic-fetch'
import _ from 'lodash'

import { call, put, fork, take, cancel, cancelled, all  } from 'redux-saga/effects'

import * as types from './types'
import { receiveCV, setHtml } from './actions'
 
import moment from 'moment'

import * as widgets from './widgets_parser'

import * as medWidgets from './widgets_som_parser'

import * as nihWidgets from './widgets_nih_parser'

function checkStatus(res) {
  if (res.status >= 400) {
    let message = `Status: ${res.status}`
    throw new Error(message)
    
  }
  return res.json()
}

export function fetchWidgetsData(uri) {
  let widgets_base_url = process.env.WIDGETS_URL
  
  const widgetsUrl = `${widgets_base_url}/api/v0.9/people/complete/all.json?uri=${uri}`

  let attempt = fetch(widgetsUrl)
  return attempt.then(res => checkStatus(res))
}


import blankTemplate from './templates/BlankTemplate.docx'
import htmlTemplate from './templates/cv_template.html'
import htmlMedicineTemplate from './templates/cv_medicine_template.html'
import htmlNihTemplate from './templates/cv_nih_template.html'

import FileSaver from 'file-saver'

import JSZip from 'jszip'
import JSZipUtils from 'jszip-utils'

function loadFile(url,callback){
  JSZipUtils.getBinaryContent(url,callback)
}


export function generateTemplate(results) {
  let widgetsParser = new widgets.WidgetsParser()

  var data = widgetsParser.convert(results)
  let compiled = _.template(htmlTemplate,'imports': {'_': _})
  let template = compiled(data)
 
  return template

}

export function generateNihTemplate(results) {
  let widgetsParser = new nihWidgets.WidgetsNIHParser()

  var data = widgetsParser.convert(results)
  let compiled = _.template(htmlNihTemplate,'imports': {'_': _})
  let template = compiled(data)
 
  return template

}

export function generateMedicineTemplate(results) {
  let widgetsParser = new medWidgets.WidgetsSOMParser()
  var data = widgetsParser.convert(results)
  let compiled = _.template(htmlMedicineTemplate,'imports': {'_': _})
  let template = compiled(data)
 
  return template
}

export function generateCVfromHtml(html, uri, template) {

  try {
    loadFile(blankTemplate, function(err,content) {
      if (err) { 
        console.error(err)
      }
    
      var zip = new JSZip(content)
      zip.file("word/document.html", html) 

      var blob = zip.generate({
          type:"blob",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        }
      ) //Output the document using Data-URI

      let index = uri.lastIndexOf("/")
      let personNumber = uri.substr(index+1)
      
      let now = moment().format()
      let fileName = ''

      if(template == "basic"){
        fileName = 'Scholars CV.docx'
      }
      else if(template == "medicine"){
        fileName = 'APT CV.docx'
      } 
      else if(template == "nih"){
        fileName = 'NIH CV.docx'
      }

      FileSaver.saveAs(blob, fileName)
    })

  } catch (e) {
   console.error(e)
  }

}

export function* fetchCV(action) {
  const { uri } = action
  const { template } = action
  const { format } = action

  try {
    const results = yield call(fetchWidgetsData, uri)

    yield put(receiveCV(results))

    if(template == "basic"){
      if (format == "word") {
        const html = yield call(generateTemplate, results)
        yield put(setHtml(html))
        yield call(generateCVfromHtml, html, uri, "basic")
      }
      else if(format == "html"){
        const html = yield call(generateTemplate, results)
        yield put(setHtml(html))
      }
    }
    else if(template == "medicine") {
      if (format == "word") {
        const html = yield call(generateMedicineTemplate, results)
        yield put(setHtml(html))
        yield call(generateCVfromHtml, html, uri, "medicine")
      }
      else if(format == "html"){
        const html = yield call(generateMedicineTemplate, results)
        yield put(setHtml(html))
      }
    }
    else if(template == "nih") {
      if (format == "word") {
        const html = yield call(generateNihTemplate, results)
        yield put(setHtml(html))
        yield call(generateCVfromHtml, html, uri, "nih")
      }
      else if(format == "html"){
        const html = yield call(generateNihTemplate, results)
        yield put(setHtml(html))
      }
    }
  } catch(e) {
    console.error(e)
  } 
}

function* watchForCV() {
  while(true) {
    const action = yield take(types.REQUEST_CV)
    
    yield fork(fetchCV, action)
  }
}


export default function* root() {
  yield [
    fork(watchForCV)
  ]
}

