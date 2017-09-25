var stripHtml = /(<([^>]+)>)/ig;
var stripOpeningTag = /<a\b[^>]*>/i;
var stripClosingTag = /<\/a>/i;

import _ from 'lodash'

// http://www.scottmessinger.com/2015/05/19/functional-programming-with-lodash/
// https://stackoverflow.com/questions/35590543/how-do-you-chain-functions-using-lodash
class WidgetsParser {
  
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
    return {'name': fullName }
  };

  parsePhone(data) {
    var phone = data['attributes']['phoneNumber'];
    return {'phoneNumber': phone }
  }

  parseEmail(data) {
    var email = data['attributes']['primaryEmail'];
    return {'email': email }
  }

  parseLocations(data) {
    let addresses = data['addresses'] || [];
    var locations = [];
    _.forEach(addresses, function(value) {
      if(value['vivoType'] == 'http://www.w3.org/2006/vcard/ns#Location')
      {
          locations.push({'address':value['label']});
      }
    });
    return {'locations':locations}
  }

  parseAddresses(data) {
    let addresses = data['addresses'] || [];
    var adds = [];
    _.forEach(addresses, function(value) {
      if(value['vivoType'] == 'http://www.w3.org/2006/vcard/ns#Address')
      {
          adds.push({'address':value['label']});
      }
    });
    return {'adds':adds}
  }

  parseTitle(data) {
    var title = data['title'];
    return {'title': title }
  }

  parsePositions(data) {
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
      }
    });

    let results = {
      'primaryPositions': primaryPositions,
      'secondaryPositions': secondaryPositions
    }
    return results
  };


  parseEducations(data) {
    var educations = data['educations'] || [];
    var educationList = []

    _.forEach(educations, function(value) {
      let institution = value.attributes['institution'];
      let endYear = [value.attributes['endDate'].substr(0,4)];
      let label = value['label'];
     
      var degree = value.attributes['degree'];
      var fullLabel = ""

      if (typeof degree != 'undefined') {
        var degree = value.attributes['degree'];
        fullLabel = (degree + ", " + institution + " " + endYear);
      }
      else {
        fullLabel = (label + ", " + institution + " " + endYear);
      }
      educationList.push({'label': fullLabel}) 
    });
  
    let results = {'educations': educationList.reverse()}
    return results
  }
  
  
  parseResearchInterests(data) {
    let overview = data['attributes']['overview'] || null;
    var researchInterests = null

    if (overview != null) {
      var research_interests = overview.replace(stripHtml, "");
      research_interests = research_interests.replace(/(&nbsp;)*/g,"");
    }
    return {'researchInterests': researchInterests}
  }


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


  parseTeaching(data) {
    let teaching = data['courses'];
    var courses = []

    _.forEach(teaching, function(value) {
      var label = value['label'];
      courses.push({'label':label});
    });

    return {'teaching': courses}
  }

  parseGrants(data) {
    let grants = data['grants'];
    var grantList = []
    _.forEach(grants, function(value) {
      var label = value['label'] + ", awarded by "
      var awardedBy = value.attributes['awardedBy'] + ", ";
      var startDate = value.attributes['startDate'].substr(0,4) + " - ";
      var endDate = value.attributes['endDate'].substr(0,4) + " ";
      var role = value.attributes['roleName'];
      grantList.push({'label':label, 'awardedBy': awardedBy,
                              'startDate': startDate, 'endDate': endDate, 'role': role});
    });
    return {'grants': grantList }
  };

  parseAwards(data) {
    let awards = data['awards'];
    var awardList = [];
    _.forEach(awards, function(value) {
      var label = value['label'];
      var date = value['attributes']['date'].substr(0,4);
      var label = (label + " " + date);   
      awardList.push({'label':label});
    });
    return {'awards': awardList}
  };

  parseProfessionalActivities(data) {
    var professionalActivitiesTypes = {
      'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#Presentation': [], 
      'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#ServiceToTheProfession': [], 
      'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#ServiceToTheUniversity' : [], 
      'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#Outreach' : []
    };

    var professionalActivities = data['professionalActivities'];
    
    _.forEach(professionalActivities, function(value) {
      let label = value['label']
      let vivoType = value['vivoType']
      professionalActivitiesTypes[vivoType].push({'label': label})
    });
 
    let pluralize = function(word) {
      switch(word) {
        case "serviceToTheProfession": {
          return "servicesToProfession"
        }
        case "serviceToTheUniversity": {
          return "servicesToDuke"
        }
        case "outreach": {
          return "outreach"
        }
        default:
          return `${word}s`
      }
      
    }

    let results = _.transform(professionalActivitiesTypes, (result, value, key) => {
      let name = this.shortName(key)
      result[name] = value
      return result;
    }, {});

    return results

  };
  // one way to do it:

  parseMedicalLicences(data) {
    //console.log("Hello in med licenses");
    //console.log("Data " + JSON.stringify(data));
    let licences = data['licenses'];
    var licenceList = [];
    _.forEach(licences, function(value) {
      var label = value['label'];
      //var date = value['attributes']['date'].substr(0,4);
      //var label = (label + " " + date);   
      licenceList.push({'label':label});
    });
    return {'licences': licenceList}
  };

   parseClinicalActivities(data) {
    let activities = data['attributes']['clinicalOverview'] || null;
    var clinical_activities = null

    if (activities != null) {
      var clinical_activities = activities.replace(stripHtml, "");
      clinical_activities = clinical_activities.replace(/(&nbsp;)*/g,"");
    }
    return {'clinical_activities': clinical_activities}
  };

  parsepastAppointments(data) {
    let pastappointments = data['pastAppointments'];
    var passAppointmentsList = [];
    _.forEach(pastappointments, function(value) {
      var label = value['label'];
      var org_label = value['attributes']['organizationLabel'];
      var start_year = value['attributes']['startYear'].substr(0,4);
      var end_year = value['attributes']['endYear'].substr(0,4);
      var label = (label + ", " + org_label + " " + start_year + " - " + end_year);   
      passAppointmentsList.push({'label':label});
    });
    return {'pastappointments': passAppointmentsList}
  };

  convert(data) {
    var results = {}

    _.merge(results, this.parseName(data))
    _.merge(results, this.parsePhone(data))
    _.merge(results, this.parseEmail(data))
    _.merge(results, this.parseTitle(data))
    _.merge(results, this.parseLocations(data))
    _.merge(results, this.parseAddresses(data))
    _.merge(results, this.parsePositions(data))
    _.merge(results, this.parseEducations(data))
    _.merge(results, this.parseResearchInterests(data))
    _.merge(results, this.parsePublications(data))
    _.merge(results, this.parseTeaching(data))
    _.merge(results, this.parseGrants(data))
    _.merge(results, this.parseAwards(data))
    _.merge(results, this.parseProfessionalActivities(data))
    _.merge(results, this.parseMedicalLicences(data))
    _.merge(results, this.parseClinicalActivities(data))
    _.merge(results, this.parsepastAppointments(data))

    return results
  }
 
};


export { 
  WidgetsParser
}





