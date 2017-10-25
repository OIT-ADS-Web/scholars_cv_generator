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
    var email = data['attributes']['primaryEmail'];
    return {'email': email }
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
    return {'otherPositions':other_positions}
  };

  parsepastAppointments(data) {
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
    let licences = data['licenses'];
    var licenceList = [];
    _.forEach(licences, function(value) {
      var label = value['label'];
      var lic_date = label.substr(label.length - 4); 
      var number = value['attributes']['number'];
      var state = value['attributes']['state'];
      label = state + ", " + number + ", " + lic_date;
      licenceList.push({'label':label});
    });
    return {'licences': licenceList}
  };

  parsePublications(data) {

    var pubTypes = {
      'journals': [],
      'manuscripts': [],    
      'letters':[],
      'editorials':[],
      'abstracts':[],
      'reviews':[],
      'others':[],
      'nonauthored':[],
      'books':[],
      'booksections':[]       
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
      
      let vivoType = value['vivoType'];
      let citation = figureCitation(value)
      
      if(value['attributes']['subtypes'] == '' || value['attributes']['subtypes'] == 'academic article') {
          pubTypes['journals'].push({'citation': citation})
      }
      if(value['attributes']['subtypes'] == 'Clinical Trial Manuscript') {
          if(value['attributes']['authorshipType'] == 'http://vivoweb.org/ontology/core#Contributorship') {
          pubTypes['manuscripts'].push({'citation': citation})
        }
      }
      if(value['attributes']['subtypes'] == 'Letter') {
          pubTypes['letters'].push({'citation': citation})
      }
      if(value['attributes']['subtypes'] == 'Editorial') {
          pubTypes['editorials'].push({'citation': citation})
      }
      if(value['attributes']['subtypes'] == 'Abstract') {
          pubTypes['abstracts'].push({'citation': citation})
      }
      if(value['attributes']['subtypes'] == 'Review') {
          pubTypes['reviews'].push({'citation': citation})
      }
      if(value['attributes']['subtypes'] == 'Other') {
          pubTypes['others'].push({'citation': citation})
      }
      if(value['attributes']['authorshipType'] == 'http://vivoweb.org/ontology/core#Editorship' || value['attributes']['authorshipType'] == 'http://vivoweb.org/ontology/core#Contributorship' 
        || value['attributes']['authorshipType'] == 'http://vivoweb.org/ontology/core#Translatorship') {
        var role = "";
        switch(value['attributes']['authorshipType']) {
          case 'http://vivoweb.org/ontology/core#Contributorship':
            role = "contributor"
            break;

          case 'http://vivoweb.org/ontology/core#Translatorship':
            role = "translator"
            break;

          case 'http://vivoweb.org/ontology/core#Editorship':
            role = "editor"
            break;

          default:
            role = ''
        }
        pubTypes['nonauthored'].push({'citation': (citation + " (" + role + ")")})
      }
      if(value['vivoType'] == 'http://purl.org/ontology/bibo/Book') {
         pubTypes['books'].push({'citation': citation})
      }
      if (value['vivoType'] == 'http://purl.org/ontology/bibo/BookSection') {
         pubTypes['booksections'].push({'citation': citation})
      }
    });

    let results = _.transform(pubTypes, (result, value, key) => { 
      let name = key
      result[name] = value
      return result;
    }, {});

    return results
  }


  parseConsultantAppointments(data) {
    var professionalActivitiesTypes = {
      'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#ServiceToTheProfession': { 'consulting': [], 'ea': [], 'cs': [] }
     };
    
    var professionalActivities = data['professionalActivities'];

    let figureConsulting = function(value) {

      var full_label = "";
      var label = value['label'];                  
      var serviceType = value.attributes['serviceType'];
      let vivoType = value['vivoType'];
      
      if(serviceType == 'Consulting') {
          full_label = label; 
      }

      return full_label;
    };

    let figureCS = function(value) {

      var full_label = "";
      var label = value['label'];                  
      var serviceType = value.attributes['serviceType'];
      let vivoType = value['vivoType'];
      
      if(serviceType == 'Community Service') {
          full_label = label; 
      }

      return full_label;
    };

    let figureEA = function(value) {

      var full_label = "";
      var label = value['label'];     
      var serviceType = value.attributes['serviceType'];
      let vivoType = value['vivoType'];

      if(serviceType == 'Editorial Activities') {
          full_label = label;
      }
      
      return full_label;
    };


     _.forEach(professionalActivities, function(value) {
    
      let consulting = figureConsulting(value)
      let community_service = figureCS(value)
      let editorial_activities = figureEA(value)
     
      let vivoType = value['vivoType'];

      if(consulting != ""){
        professionalActivitiesTypes[vivoType]['consulting'].push(consulting);
      }
      if(community_service != ""){
        professionalActivitiesTypes[vivoType]['cs'].push(community_service);
      }
      if(editorial_activities != ""){
      professionalActivitiesTypes[vivoType]['ea'].push(editorial_activities);
      }
      
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
        case "presentation": {
          return "Presentation"
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

  }

  parseScholarlySocieties(data) {
    let awards = data['awards'];
    var scholarlySocietiesList = [];
    _.forEach(awards, function(value) {
      if(value['attributes']['serviceType'] == 'Scholarly Societies') {
        var label = value['label'];
        var date = value['attributes']['date'].substr(0,4);
        var label = (label + " " + date);   
        scholarlySocietiesList.push({'label':label});
      }
    });
    return {'scholarlySocieties': scholarlySocietiesList}
  };

  parseAwards(data) {
    let awards = data['awards'];
    var awardList = [];
    _.forEach(awards, function(value) {
      if(value['attributes']['serviceType']  != 'Scholarly Societies') {
        var label = value['label'];
        var date = value['attributes']['date'].substr(0,4);
        var label = (label + " " + date);   
        awardList.push({'label':label});
      }
    });
    return {'awards': awardList}
  };

  parseGrants(data) {
    
    var grants = data['grants'] || [];
    var currentGrantList = []
    var completedGrantList = []
    var pendingGrantList = []
    
    _.forEach(grants, function(value) {
      var startDate = new Date(value.attributes['startDate']);
      var endDate = new Date(value.attributes['endDate']);
      var today = new Date();

      var pi = value.attributes['piName'];
      var period = startDate.getFullYear() + " - " + endDate.getFullYear();
      var title = value['label'] + ", awarded by " + value.attributes['awardedBy'];
      var role = value.attributes['roleName'];

      if(startDate < today && endDate > today)
      {
         currentGrantList.push({'pi': pi, 'period': period, 'title': title, 'role': role})
      }
      if(endDate < today)
      {
         completedGrantList.push({'pi': pi, 'period': period, 'title': title, 'role': role})
      }
      if(startDate > today)
      {
         pendingGrantList.push({'pi': pi, 'period': period, 'title': title, 'role': role})
      }
    });

    let results = {'currentGrants': currentGrantList, 'completedGrants': completedGrantList, 'pendingGrants': pendingGrantList }
    return results
  };

  parsementorshipOverview(data) {
    let overview = data['attributes']['mentorshipOverview'] || null;
    var mentorship_activities = null

    if (overview != null) {
      var mentorship_activities = overview.replace(stripHtml, "");
      mentorship_activities =  mentorship_activities.replace(/(&nbsp;)*/g,"");
    }
    return {'mentorship_Activities': mentorship_activities}
  };

  parseteachingActivities(data) {
    let activities = data['attributes']['teachingActivities'] || null;
    var teaching_activities = null

    if (activities != null) {
      var teaching_activities = activities.replace(stripHtml, "");
      teaching_activities =  teaching_activities.replace(/(&nbsp;)*/g,"");
    }
    return {'teaching_Activities': teaching_activities}
  };

  parsePresentations(data) {
    var presentationList = [];  
    let professionalActivities = data['professionalActivities'];

     _.forEach(professionalActivities, function(value) {
        if( value['vivoType'] == 'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#Presentation' ) {
             var label = value['label'];     
             var serviceType = value.attributes['serviceType'];
             let vivoType = value['vivoType'];
         }
        presentationList.push({'label':label});

      });
     return {'presentations': presentationList}
  }

  parseClinicalActivities(data) {
    let activities = data['attributes']['clinicalOverview'] || null;
    var clinical_activities = null

    if (activities != null) {
      var clinical_activities = activities.replace(stripHtml, "");
      clinical_activities = clinical_activities.replace(/(&nbsp;)*/g,"");
    }
    return {'clinical_Activities': clinical_activities}
  };

  parseacademicActivities(data) {
    let activities = data['attributes']['academicActivities'] || null;
    var academic_activities = null

    if (activities != null) {
      var academic_activities = activities.replace(stripHtml, "");
      academic_activities =  academic_activities.replace(/(&nbsp;)*/g,"");
    }
    return {'academic_Activities': academic_activities}
  };



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
    _.merge(results, this.parseConsultantAppointments(data))
    _.merge(results, this.parseScholarlySocieties(data))
    _.merge(results, this.parseAwards(data))
    _.merge(results, this.parseGrants(data))
    _.merge(results, this.parsementorshipOverview(data))
    _.merge(results, this.parseteachingActivities(data))
    _.merge(results, this.parsePresentations(data))
    _.merge(results, this.parseClinicalActivities(data))
    _.merge(results, this.parseacademicActivities(data))

    return results
  }
 
};


export { 
  WidgetsSOMParser
}





