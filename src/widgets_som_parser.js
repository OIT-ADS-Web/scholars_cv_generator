var stripHtml = /(<([^>]+)>)/ig;
var stripOpeningTag = /<a\b[^>]*>/i;
var stripClosingTag = /<\/a>/i;

import _ from 'lodash'

// http://www.scottmessinger.com/2015/05/19/functional-programming-with-lodash/
// https://stackoverflow.com/questions/35590543/how-do-you-chain-functions-using-lodash
class WidgetsSOMParser {
  
  /*
  constructor(data) {
    this.data = data
  }
  */

  pluralize(word) {
      switch(word) {
        case "thesis": {
          return "theses"
        }
        case "review": {
          return "bookReviews"
        }
        case "bookSeries": {
          return "bookSeries"
        }
        case "editedBook": {
          return "scholarlyEditions"
        }
        case "software": {
          return "software"
        }
        case "serviceToTheProfession": {
          return "servicesToProfession"
        }
        case "serviceToTheUniversity": {
          return "servicesToDuke"
        }
        case "outreach": {
          return "outreach"
        }
        default: {
          return `${word}s`
        }
      }
      
  }

  shortName(uri) {
      // NOTE: two types of URIs (at this point)
      // 'http://purl.org/ontology/bibo/AcademicArticle': [],
      // 'http://vivoweb.org/ontology/core#Review': [], 
      var index = uri.lastIndexOf("#")
      if (index < 0) {
        index = uri.lastIndexOf("/")
      }
      // also pluralize
      let name = _.camelCase(uri.substr(index + 1))
      return this.pluralize(name)
  }

  parseName(data) {
    var firstName = data['attributes']['firstName'];
    var middleName = data['attributes']['middleName'];
    var lastName = data['attributes']['lastName'];
  
    var fullName = "";

    if (typeof middleName != 'undefined' && middleName != null && middleName.length > 0) {
      fullName = firstName + " " + middleName + " " + lastName;
    }
    else {
      fullName = firstName + " " + lastName;
      middleName = false;
    };
    
    return {'name': fullName, 'lastName': lastName }
  };

  parsePhone(data) {
    var phone = data['attributes']['phoneNumber'];
    return {'phoneNumber': phone }
  }

  parseEmail(data) {
    console.log("HOWDY1****");
    var email = data['attributes']['primaryEmail'];
    return {'email': email }
  }

  parseTitle(data) {
    console.log("HOWDY2****");
    var title = data['title'];
    return {'title': title }
  }

  parsePositions(data) {
    console.log("HOWDY3****");
    let positions = data['positions'] || [];
    var primaryPositions = []
    var secondaryPositions = []

    let positionTypes = {
      'primaryPosition': 'http://vivoweb.org/ontology/core#PrimaryPosition',
      'secondaryPosition': 'http://vivo.duke.edu/vivo/ontology/duke-extension#SecondaryPosition'
    };

    // group by 'type'    
    _.forEach(positions, function(value) {
      var vivoType = value['vivoType'];
      var label = value['label'];
      switch(vivoType) {
        case positionTypes['primaryPosition']: {
          primaryPositions.push({'label': label})
          break;
        }
        case positionTypes['secondaryPosition']: {
          secondaryPositions.push({'label':label})
          break;
        }
        default: {
          secondaryPositions.push({'label':label})
          break;
        }
      }
    });

    let results = {
      'primaryPositions': primaryPositions,
      'secondaryPositions': secondaryPositions
    }
    return results
  };

  parseEducations(data) {
    console.log("HOWDY_ED****");
    var educations = data['educations'] || [];
    var educationList = []
    var profexpList = []
    _.forEach(educations, function(value) {
      let institution = value.attributes['institution'];
      let endYear = value.attributes['endDate'].substr(0,4);
      let label = value['label'];
      var degree = value.attributes['degree'];
      var fullLabel = "";
      if (typeof degree != 'undefined') {
        var degree = value.attributes['degree'];
        fullLabel = (degree + ", " + institution + " " + endYear);
        educationList.push({'label': fullLabel, 'endYear': endYear}) 
      } 
      else {
        let startYear = value.attributes['startDate'].substr(0,4);
        fullLabel = (label + ", " + institution);
        profexpList.push({'label': fullLabel, 'startYear': startYear, 'endYear': endYear}) 
      }
    });

    let results = {'educations': educationList, 'profExperiences': profexpList}
    return results
  }

  parseOtherPositions(data) {
    console.log("HOWDY_other****");
    let otherPositions = data['academicPositions'] || [];
    var other_positions = [];
    _.forEach(otherPositions, function(value) {
      if(value['vivoType'] == 'http://vivo.duke.edu/vivo/ontology/duke-cv-extension#NonDukePosition')
      {
          var fullLabel = "";
          var label = value['label'];
          var startYear = value['attributes']['startDate'].substr(0,4);
          var endYear = value['attributes']['endDate'].substr(0,4);
          fullLabel = label;
          other_positions.push({'label':fullLabel, 'startYear': startYear, 'endYear': endYear});
      }
    });
    console.log("sdDFSFDSDFSDFSDFSDFSDFS");
    console.log(other_positions);
    return {'otherPositions':other_positions}
  };

  parsepastAppointments(data) {
    console.log("HOWDY5****");
    let pastappointments = data['pastAppointments'];
    var pastAppointmentsList = [];
    _.forEach(pastappointments, function(value) {
      var label = value['label'];
      var org_label = value['attributes']['organizationLabel'];
      var start_year = value['attributes']['startYear'].substr(0,4);
      var end_year = value['attributes']['endYear'].substr(0,4);
      var full_label = (label + ", " + org_label + " " + start_year + " - " + end_year);   
      pastAppointmentsList.push({'label':full_label, 'orig_label':label, 'org_label':org_label, 'startYear':start_year, 'endYear':end_year});
    });

    pastAppointmentsList.sort(function(a,b) {return (a.startYear < b.startYear) ? 1 : ((b.startYear < a.startYear) ? -1 : 0);} );
    return {'pastappointments': pastAppointmentsList}
  };

  parseMedicalLicences(data) {
    console.log("HOWDY6****");
    //console.log("Hello in med licenses");
    //console.log("Data " + JSON.stringify(data));
    let licences = data['licenses'];
    var licenceList = [];
    _.forEach(licences, function(value) {
      var label = value['label'];
      var lic_date = label.substr(label.length - 4);
      //var date = value['attributes']['date'].substr(0,4);
      //var label = (label + " " + date);   
      var number = value['attributes']['number'];
      var state = value['attributes']['state'];
      label = state + ", " + number + ", " + lic_date;
      licenceList.push({'label':label});
    });
    return {'licences': licenceList}
  };

  parsePublications(data) {
    
    var pubTypes = {
      'http://purl.org/ontology/bibo/AcademicArticle': [],
      'http://purl.org/ontology/bibo/Book': [], 
      'http://vivoweb.org/ontology/core#Review': [], 
      'http://purl.org/ontology/bibo/BookSection': [], 
      'http://vivo.duke.edu/vivo/ontology/duke-extension#BookSeries': [],
      'http://vivoweb.org/ontology/core#ConferencePaper': [],
      'http://vivoweb.org/ontology/core#Dataset': [],
      'http://vivo.duke.edu/vivo/ontology/dukeextension#DigitalPublication': [],
      'http://vivo.duke.edu/vivo/ontology/duke-extension#JournalIssue': [],
      'http://purl.org/ontology/bibo/Report': [], 
      'http://purl.org/ontology/bibo/EditedBook': [], 
      'http://purl.org/ontology/bibo/Thesis': [],
      'http://vivo.duke.edu/vivo/ontology/duke-extension#OtherArticle': [],
      'http://vivoweb.org/ontology/core#Software': []              
    };
    
    var publications = data['publications'] || [];

    let figureCitation = function(value) {
      var citation = value.attributes['mlaCitation']
            .replace(stripOpeningTag,"")
            .replace(stripClosingTag, "");

      citation = citation.replace(stripHtml, "");
      
      var vivoType = value['vivoType'];
  
      if (vivoType === "http://purl.org/ontology/bibo/AcademicArticle") {
        let pubmed = value.attributes['pmid'];
        let pubmedid = value.attributes['pmcid'];    
 
        if (typeof pubmed !== 'undefined' && typeof pubmedid !== 'undefined') {
          citation = citation + " PMID: " + pubmed + ". PMCID: " + pubmedid + ".";
        }
        else if (typeof pubmed !== 'undefined') {
          citation = citation + " PMID: " + pubmed + ".";
        };  
      }
      return citation
    };

    _.forEach(publications, function(value) {
      
      let citation = figureCitation(value)
      let vivoType = value['vivoType'];
       
      pubTypes[vivoType].push({'citation': citation})
      
    });


    let results = _.transform(pubTypes, (result, value, key) => { 
      let name = this.shortName(key)
      result[name] = value
      return result;
    }, {});

    return results
  }

  convert(data) {
    var results = {}

    _.merge(results, this.parseName(data))
    _.merge(results, this.parsePhone(data))
    _.merge(results, this.parseEmail(data))
    _.merge(results, this.parseTitle(data))
    _.merge(results, this.parsePositions(data))
    _.merge(results, this.parseEducations(data))
    _.merge(results, this.parseOtherPositions(data))
    _.merge(results, this.parsepastAppointments(data))
    _.merge(results, this.parseMedicalLicences(data))
    _.merge(results, this.parsePublications(data))

    return results
  }
 
};


export { 
  WidgetsSOMParser
}





