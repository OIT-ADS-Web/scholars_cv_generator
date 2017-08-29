import fetch from 'isomorphic-fetch'
import _ from 'lodash'

import { call, put, fork, take, cancel, cancelled, all  } from 'redux-saga/effects'

import * as types from './types'
import { receiveCV } from './actions'
 
import moment from 'moment'

function checkStatus(res) {
  console.log("sagas.checkStatus")

  if (res.status >= 400) {
    let message = `Status: ${res.status}`
    throw new Error(message)
    
  }
  return res.json()
}

// 1. actual function
export function fetchCVApi() {
  console.log("sagas.fetchCVApi")
 
  let widgets_base_url = process.env.WIDGETS_URL
  let uri = "https://scholars.duke.edu/individual/per4284062"
  
  const widgetsUrl = `${widgets_base_url}/api/v0.9/people/complete/all.json?uri=${uri}`

  let attempt = fetch(widgetsUrl)
  return attempt.then(res => checkStatus(res))
}

//import cvTemplate from './templates/cv_template.docx'
import blankTemplate from './templates/BlankTemplate.docx'
import htmlTemplate from './templates/cv_template.html'

import FileSaver from 'file-saver'
import Docxtemplater from 'docxtemplater'

import JSZip from 'jszip'
import JSZipUtils from 'jszip-utils'

function loadFile(url,callback){
  JSZipUtils.getBinaryContent(url,callback)
}
 
import convertData from './widgets_parser'

export function generateCV(results) {
  console.log("sagas.generateCV")

  try {
    
    loadFile(blankTemplate, function(err,content) {
      if (err) { 
        console.log(err)
      }
    
      var zip = new JSZip(content)
      var doc=new Docxtemplater().loadZip(zip)
      
      var data = convertData(results)

      console.log("****** tranformed data:******")
      console.log(data)

      var compiled = _.template(htmlTemplate,'imports': {'_': _})
      var template = compiled(data)
      
      //var blob_html = new Blob([template], {type: "application/msword"})
 
      // NOTE: don't actually need this data in word template     
      doc.setData(data)    
      
      let zipDocs = doc.getZip() 
      // NOTE: this is how to add a new file.  BlankTemplate has a pointer
      // to "word/document.html" but the file does not actually exist (in the template)
      // this is what completes the file and makes it valid (and also gives it content)
      zipDocs.file("word/document.html", template) 

      doc.render() 
      var blob =doc.getZip().generate({
          type:"blob",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        }
      ) //Output the document using Data-URI
 
      // FIXME: needs to be global and sent in from query parameters
      // e.g. scholars_cv_generator?uri=?
      let uri = "https://scholars.duke.edu/individual/per4284062"
      let index = uri.lastIndexOf("/")
      let personNumber = uri.substr(index+1)
      
      let now = moment().format()
      let fileName = `${personNumber}_${now}.docx`
      FileSaver.saveAs(blob, fileName)

    })
  

  } catch (e) {
   console.log(e)
  }

}

export function* fetchCV() {
  console.log("sagas.fetchCV")

  try {
    const results = yield call(fetchCVApi)
    //console.log(results)
    yield put(receiveCV(results))

    //yield put(downloadCV(results))
    yield call(generateCV, results)

  } catch(e) {
    //yield put(cvFailed(e.message))
  } 
}

//const score2 = yield* playLevelTwo()

/*

var loadFile=function(url,callback){
  JSZipUtils.getBinaryContent(url,callback);
};
 
var run_template= function(data) {
  loadFile("cv_template.docx",function(err,content){
    if (err) { 
      //console.debug(err);
      throw err
    };
    doc=new Docxgen(content);
    doc.setData(data);    
    doc.render(); //apply them (replace all occurences of {first_name} by Hipp, ...)
    out=doc.getZip().generate({type:"blob"}) //Output the document using Data-URI
    saveAs(out,"cv.docx")
  });
};


function* mainSaga(getState) {
  const results = yield all([call(task1), call(task2), ...])
  yield put(showResults(results))
}

*/

// 3. watcher
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
  //yield all([call(watchForCV)])
}

