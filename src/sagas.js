import { call, put, fork, take, cancel, cancelled  } from 'redux-saga/effects'

import { all } from 'redux-saga/effects'

import fetch from 'isomorphic-fetch'

import * as types from './types'

import { receiveCV } from './actions'
 
import _ from 'lodash'

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
 
 const widgetsUrl = "https://scholars.duke.edu/widgets/api/v0.9/people/complete/all.json?uri=https://scholars.duke.edu/individual/per4284062"

  let attempt = fetch(widgetsUrl)
  return attempt.then(res => checkStatus(res))
}


import cvTemplate from './templates/cv_template.docx'

import FileSaver from 'file-saver'
import Docxtemplater from 'docxtemplater'

import JSZip from 'jszip'
import JSZipUtils from 'jszip-utils'

//var JSZip = require("jszip")

//import fs from 'fs'

//var Docxtemplater = require('docxtemplater');

//var fileContent = require("binary-loader!./templates/cv_template.docx");

function loadFile(url,callback){
  JSZipUtils.getBinaryContent(url,callback)
}
 

function convertData(data) {
  var stripHtml = /(<([^>]+)>)/ig;
  var stripOpeningTag = /<a\b[^>]*>/i;
  var stripClosingTag = /<\/a>/i;

  // encompassing hash
  var results = {'cv': [], 'academicArticlesLabel': [], 'booksLabel': [], 
    'name': [], 'primaryPositionLabel': [], 'primaryPosition': [], 
    'secondaryPositionLabel': [], 'secondaryPosition': [], 
    'educationsLabel': [], 'educations': [], 'publicationsLabel': [], 
    'bookReviewsLabel': [], 'bookSectionsLabel': [], 'bookSeriesLabel': [], 
    'conferencePapersLabel': [], 'datasetsLabel': [], 'digitalPublicationsLabel': [], 
    'journalIssuesLabel': [], 'reportsLabel': [], 'scholarlyEditionsLabel': [], 
    'thesesLabel': [], 'otherArticlesLabel': [],
    'academicArticles': [], 'books': [], 'bookReviews': [], 'bookSections': [], 
    'bookSeries': [], 
    'conferencePapers': [], 'datasets': [], 'digitalPublications': [], 
    'journalIssues': [], 'reports': [], 'scholarlyEdition': [], 
    'theses': [], 'otherArticles': [], 'softwareLabel': [], 'software': [], 
    'teachingLabel': [], 'teaching': [], 'grantsLabel': [], 
    'grants': [], 'researchInterestsLabel': [], 'awardsLabel': [], 
    'awards': [], 'presentationsLabel': [], 'presentations': [], 
    'servicesToProfessionLabel': [], 'servicesToProfession': [], 
    'servicesToDukeLabel': [], 'servicesToDuke': [], 'outreachLabel': [], 
    'outreach': [], 'researchInterests': []
  };   

  //name
  var firstName = data['attributes']['firstName'];
  var middleName = data['attributes']['middleName'];
  var lastName = data['attributes']['lastName'];
  if (typeof middleName != 'undefined' && middleName != null && middleName.length > 0) {
    var fullName = firstName + " " + middleName + " " + lastName;
  }
  else {
    var fullName = firstName + " " + lastName;
    middleName = false;
  };
  results['name'].push({'fullName': fullName});

  // primary & secondary positions
  var positions =  data['positions'];
  var positionTypes = {
    'primaryPosition': 'http://vivoweb.org/ontology/core#PrimaryPosition',
    'secondaryPosition': 'http://vivo.duke.edu/vivo/ontology/duke-extension#SecondaryPosition'
  };
  if (typeof positions != 'undefined' && positions != null && positions.length > 0) {
    $.each(positions, function(index, value) { 
      var vivoType = value['vivoType'];
      var label = value['label'];
      if (vivoType != null) {
        switch (vivoType) {
          case positionTypes['primaryPosition']:
            results['primaryPosition'].push({'label': label});
            results['primaryPositionLabel'][0] = "Primary Appointment:";
          break;
          case positionTypes['secondaryPosition']:
            results['secondaryPosition'].push({'label':label});
            results['secondaryPositionLabel'][0] = "Secondary Appointment:";
          break;
        };
      };
    });
  }
  else {
    positions = false;
  };

  // present academic rank and title
  var title = data['title'];

  //educations
  var educations = data['educations'];
  if (typeof educations != 'undefined' && educations != null && educations.length > 0) {
    results['educationsLabel'] = "Education:";
    $.each(educations, function(index, value) {
      var institution = value.attributes['institution'];
      var endYear = [value.attributes['endDate'].substr(0,4)];
      var degree = value.attributes['degree'];
      var label = value['label'];
      if (typeof degree != 'undefined') {
        var degree = value.attributes['degree'];
        var allEducation = (degree + ", " + institution + " " + endYear);
      }
      else {
        allEducation = (label + ", " + institution + " " + endYear);
      }
      results['educations'].push({'allEducation': allEducation}); 
    });
  }
  else {
    educations = false;
  };
  results['educations'].reverse();

  //research interests
  var overview = data['attributes']['overview'];
  if (typeof overview != 'undefined' && overview != null && overview.length > 0) {
    results['researchInterestsLabel'] = "Research Interests:";  
    var research_interests = overview.replace(stripHtml, "");
    research_interests = research_interests.replace(/(&nbsp;)*/g,"");
    results['researchInterests'].push({'research_interests': research_interests});
  }
  else {
    overview = false;
    research_interests = false;
  };

  results['cv'].push({'title': title});  


  var pubTypes = {
    'academicArticles': 'http://purl.org/ontology/bibo/AcademicArticle',
    'books': 'http://purl.org/ontology/bibo/Book', 
    'bookReviews': 'http://vivoweb.org/ontology/core#Review', 
    'bookSections': 'http://purl.org/ontology/bibo/BookSection', 
    'bookSeries': 'http://vivo.duke.edu/vivo/ontology/duke-extension#BookSeries',
    'conferencePapers': 'http://vivoweb.org/ontology/core#ConferencePaper',
    'datasets': 'http://vivoweb.org/ontology/core#Dataset',
    'digitalPublications': 'http://vivo.duke.edu/vivo/ontology/dukeextension#DigitalPublication',
    'journalIssues': 'http://vivo.duke.edu/vivo/ontology/duke-extension#JournalIssue',
    'reports': 'http://purl.org/ontology/bibo/Report', 
    'scholarlyEdition': 'http://purl.org/ontology/bibo/EditedBook', 
    'theses': 'http://purl.org/ontology/bibo/Thesis',
    'otherArticles': 'http://vivo.duke.edu/vivo/ontology/duke-extension#OtherArticle',
    'software': 'http://vivoweb.org/ontology/core#Software'              
  };

  var pubs = data['publications'];
  if (typeof pubs != 'undefined' && pubs != null && pubs.length > 0) {
    results['publicationsLabel'][0] = "Publications:";
    $.each(pubs, function(index, value) {      
      var citation = value.attributes['mlaCitation'].replace(stripOpeningTag,"").replace(stripClosingTag, "");
      citation = citation.replace(stripHtml, "");
      var pubmed = value.attributes['pmid'];
      var pubmedid = value.attributes['pmcid'];    
      var vivoType = value['vivoType'];
      var date = value.attributes['datetime'];
      if (vivoType != null) {
        if (vivoType === pubTypes['academicArticles']) {
          var academicArticles = "Academic Articles";
          if (typeof pubmed !== 'undefined' && typeof pubmedid !== 'undefined') {
            citation = citation + " PMID: " + pubmed + ". PMCID: " + pubmedid + ".";
          }
          else if (typeof pubmed !== 'undefined') {
            citation = citation + " PMID: " + pubmed + ".";
          };  
          results['academicArticlesLabel'] = academicArticles;
          results['academicArticles'].push({'citation': citation});
        };
        if (vivoType === pubTypes['books']) {
          var books = "Books";
          results['booksLabel'] = books;
          results['books'].push({'citation': citation}); 
        };
        if (vivoType === pubTypes['bookReviews']) {
          var bookReviews = "Book Reviews";
          results['bookReviewsLabel'] = bookReviews;
          results['bookReviews'].push({'citation':citation}); 
        };
        if (vivoType === pubTypes['bookSections']) {
          var bookSections = "Book Sections";
          results['bookSectionsLabel'] = bookSections;
          results['bookSections'].push({'citation': citation});  
        };
        if (vivoType === pubTypes['bookSeries']) {
          var bookSeries = "Book Series";
          results['bookSeriesLabel'] = bookSeries;
          results['bookSeries'].push({'citation': citation});   
        };
        if (vivoType === pubTypes['conferencePapers']) {
          var conferencePapers = "Conference Papers";
          results['conferencePapersLabel'] = conferencePapers;
          results['conferencePapers'].push({'citation': citation}); 
        };
        if (vivoType === pubTypes['datasets']) {
          var datasets = "Datasets";
          results['datasetsLabel'] = datasets;
          results['datasets'].push({'citation': citation});  
        };
        if (vivoType === pubTypes['digitalPublications']) {
          var digitalPublications = "Digital Publications";
          results['digitalPublicationsLabel'] = digitalPublications;
          results['digitalPublications'].push({'citation': citation});   
        };
        if (vivoType === pubTypes['journalIssues']) {
          var journalIssues = "Journal Issues";
          results['journalIssuesLabel'] = journalIssues;
          results['journalIssues'].push({'citation': citation}); 
        };
        if (vivoType === pubTypes['reports']) {
          var reports = "Reports";
          results['reportsLabel'] = reports;
          results['reports'].push({'citation': citation});
        };
        if (vivoType === pubTypes['scholarlyEdition']) {
          var scholarlyEdition = "Scholarly Editions";
          results['scholarlyEditionsLabel'] = scholarlyEdition;
          results['scholarlyEdition'].push({'citation': citation});
        };
        if (vivoType === pubTypes['theses']) {
          var theses = "Theses and Dissertations";
          results['thesesLabel'] = theses;
          results['theses'].push({'citation': citation});
        };
        if (vivoType === pubTypes['otherArticles']) {
          var otherArticles = "Other Articles";
          results['otherArticlesLabel'] = otherArticles;
          results['otherArticles'].push({'citation': citation});
        };
        if (vivoType === pubTypes['software']) {
          var software = "Software";
          results['softwareLabel'] = software;
          results['software'].push({'citation': citation});
        };
      };
    });
  };

  //TEACHING
  var teaching = data['courses'];
  if (typeof teaching != 'undefined' && teaching != null && teaching.length > 0) {
    results['teachingLabel'][0] = "Teaching Responsibilities:";
    $.each(teaching, function(index, value) {
      var label = value['label'];
      results['teaching'].push({'label':label});
    });
  }
  else {
    teaching = false;
  };

  //GRANTS
  var grants = data['grants'];
  if (typeof grants != 'undefined' && grants != null && grants.length > 0) {
    results['grantsLabel'][0] = "Grants:";
    $.each(grants, function(index, value) {
      var label = value['label'] + ", awarded by "
      var awardedBy = value.attributes['awardedBy'] + ", ";
      var startDate = value.attributes['startDate'].substr(0,4) + " - ";
      var endDate = value.attributes['endDate'].substr(0,4) + " ";
      var role = value.attributes['roleName'];
      results['grants'].push({'label':label, 'awardedBy': awardedBy,
                              'startDate': startDate, 'endDate': endDate, 'role': role});
    });
  }
  else {
    grants = false;
  };

  //AWARDS
  var awards = data['awards'];
  if (typeof awards != 'undefined' && awards != null && awards.length > 0) {
    results['awardsLabel'][0] = "Awards and Honors:";
    $.each(awards, function(index,value) {
      var label = value['label'];
      var date = value['attributes']['date'].substr(0,4);
      var label = (label + " " + date);   
      results['awards'].push({'label':label});
    });
  }
  else {
    awards = false;
  };


  //PROFESSIONAL ACTIVITIES
  var professionalActivitiesTypes = {
    'presentations': 'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#Presentation', 
    'servicesToProfession': 'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#ServiceToTheProfession', 
    'servicesToDuke': 'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#ServiceToTheUniversity', 
    'outreach': 'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#Outreach'
  };

  var professionalActivities = data['professionalActivities'];
  $.each(professionalActivities, function(index,value) {
    var label = value['label'];
    var vivoType = value['vivoType'];
    if (vivoType != null) {
      switch (vivoType) {
        case professionalActivitiesTypes['presentations']:
          results['presentationsLabel'][0] = "Presentations and Appearances:";
          results['presentations'].push({'label':label});
          break;
        case professionalActivitiesTypes['servicesToProfession']:
          results['servicesToProfessionLabel'][0] = "Services to the Profession:";
          results['servicesToProfession'].push({'label':label});
          break;
        case professionalActivitiesTypes['servicesToDuke']:
          results['servicesToDukeLabel'][0] = "Services to Duke:";
          results['servicesToDuke'].push({'label': label});
          break;
        default:
          results['outreachLabel'][0] = "Outreach and Engaged Scholarship:";
          results['outreach'].push({'label':label});        
      };
    }
    else {
      professionalActivities = false;
    };
  });

  // different templates for different pub data 
  /*
  if (results['academicArticles'].length >= 1 && results['books'].length === 0 && results['bookReviews'].length === 0 &&
      results['bookSections'].length === 0 && results['bookSeries'].length === 0 && results['conferencePapers'].length === 0 &&
      results['datasets'].length === 0 && results['digitalPublications'].length === 0 && results['journalIssues'].length === 0 &&
      results['reports'].length === 0 && results['scholarlyEdition'].length === 0 && results['theses'].length === 0 && 
      results['otherArticles'].length === 0 && results['software'].length === 0) 
  {
    //run_template_a(results);
  }
  else {
    //run_template(results);
  };
  */

  return results
};



export function generateCV(results) {
  console.log("sagas.generateCV")

  /*
    Response.AddHeader("Content-Disposition", "inline;filename=" + fileName);
    return new FileStreamResult(WordStream(doc.DocumentBody), "application/msword");
  */

  try {
    //console.log(cvTemplate)

    //var doc=new Docxgen(cvTemplate)
    
   //var content = fs.readFileSync(cvTemplate, 'binary')

    //var zip = new JSZip(fileContent)

    //var doc=new Docxtemplater().loadZip(zip)

    //var blob = new Blob(doc.getZip().generate({type:"blob"}), {type: "application/msword"})

   // FileSaver.saveAs(blob, "hello world.doc")

 
    //var zip = new JSZip(cvTemplate)


  loadFile(cvTemplate,function(err,content){
  //loadFile("./templates/cv_template.docx",function(err,content){
    if (err) { 
      console.log(err)
      //throw err
    }
    
    console.log(content)

    var zip = new JSZip(content)

    //console.log(zip)

    var doc=new Docxtemplater().loadZip(zip)
    var data = convertData(results)
    doc.setData(data)    
    doc.render() 
    var blob =doc.getZip().generate({
       type:"blob",
       mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      }
    ) //Output the document using Data-URI
     
    //console.log(blob)
    //var blob = new Blob(doc.getZip().generate({type:"blob"}), {type: "application/msword"})

    FileSaver.saveAs(blob, "hello_world.doc")

    //saveAs(out,"cv.docx")
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

