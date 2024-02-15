var stripHtml = /(<([^>]+)>)/ig;
var stripOpeningTag = /<a\b[^>]*>/i;
var stripClosingTag = /<\/a>/i;

import _ from 'lodash'

// http://www.scottmessinger.com/2015/05/19/functional-programming-with-lodash/
// https://stackoverflow.com/questions/35590543/how-do-you-chain-functions-using-lodash
class WidgetsPubMedParser {
  
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
    // remaining
    var otherTitlePositions = []
    var allPositions = []

    _.forEach(positions, function(value) {
      let label = value['label'];
      let year = value['attributes']['startYear'].substr(0,4);
      let category = value['attributes']['appointmentTypeCode'];
      let organizationLabel = value['attributes']['organizationLabel'];
      switch(category) {
        case 'P': {
          primaryPositions.push({'label': label, 'organizationLabel': organizationLabel})
          break;
        }
        case 'S': {
          secondaryPositions.push({'label':label, 'organizationLabel': organizationLabel})
          break;
        }
        default: {
          otherTitlePositions.push({'label':label})
          break;
        }
      }
      allPositions.push({'institution': 'Duke University', 'orig_label':label, 'startYear': year, 'category': category})
    });
    let pastAppointments = data['pastAppointments'];
    var pastAppointmentsList = [];
    _.forEach(pastAppointments, function(value) {
      var label = value['label'];
      var org_label = value['attributes']['organizationLabel'];
      var start_year = value['attributes']['startYear'].substr(0,4);
      var end_year = value['attributes']['endYear'].substr(0,4);
      let category = value['attributes']['appointmentTypeCode'];

      var full_label = (label + ", " + org_label + " " + start_year + " - " + end_year);   
      pastAppointmentsList.push({'label':full_label, 
        'orig_label':label,
        'institution': 'Duke University',
        'org_label':org_label, 
        'startYear':start_year, 
        'endYear':end_year,
        'category': category});
    });

    pastAppointmentsList.sort(function(a,b) {return (a.startYear < b.startYear) ? 1 : ((b.startYear < a.startYear) ? -1 : 0);} );
    
    let arrs = [allPositions, pastAppointmentsList]
    let merged = [...new Set(arrs.flat())];

    let academicAppointments = merged.filter(pos => pos.category != 'A');
    let administrativeAppointments = merged.filter(pos => pos.category == 'A');
    
    let pastPrimaryAppointments = pastAppointmentsList.filter(pos => pos.category == 'P');
    // in case sort if lost by filter
    pastPrimaryAppointments.sort(function(a,b) {
      return (a.startYear < b.startYear) ? 1 : ((b.startYear < a.startYear) ? -1 : 0);
    });
 
    let results = {
      // NOTE: these do *not* include pastAppointments
      'primaryPositions': primaryPositions,
      'secondaryPositions': secondaryPositions,
      'otherTitlePositions': otherTitlePositions,
      'allPositions': allPositions,
      'pastAppointments': pastAppointmentsList,
      // NOTE: these *do* include past appointments
      'academicAppointments': academicAppointments,
      'administrativeAppointments': administrativeAppointments,
      // NOTE: these ONLY include past appts
      'pastPrimaryAppointments': pastPrimaryAppointments,
    }
    return results
  };

  parseEducations(data) {
    var educations = data['educations'] || [];
    var educationList = []
    var profexpList = []
    var isTypeOf = "profExperiences";
    _.forEach(educations, function(value) {
      let institution = value.attributes['institution'];
      let endYear = value.attributes['endDate'] ? value.attributes['endDate'].substr(0,4) : '';
      let label = value['label'];
      var degree = value.attributes['degree'];
      var fullLabel = "";
      if (typeof degree != 'undefined') {
        var degree = value.attributes['degree'];
        fullLabel = (degree + ", " + institution);
        if (endYear != '') {
          fullLabel = (fullLabel + ", " + endYear);
        }
        educationList.push({'label': fullLabel, 'endYear': endYear}) 
      } 
      else {
        let startYear = value.attributes['startDate'].substr(0,4);
        fullLabel = (label + ", " + institution);
        profexpList.push({'label': label, 'institution': institution, 'startYear': startYear, 'endYear': endYear, isTypeOf: isTypeOf}) 
      }
    });
    let profexpAcademicAppointments = this.parsePositions(data).academicAppointments;
    let profexpAdministrativeAppointments = this.parsePositions(data).administrativeAppointments;
    let academicPositionsData = this.parseOtherPositions(data).otherPositions;
    let profexpSection = profexpList.concat(profexpAcademicAppointments, profexpAdministrativeAppointments, academicPositionsData )
    let results = {'educations': educationList, 'profexpSection': profexpSection, 'profExperiences': profexpList, 'profexpAcademicAppointments': profexpAcademicAppointments, 'profexpAdministrativeAppointments': profexpAdministrativeAppointments, 'academicPositionsData': academicPositionsData }
    
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
          var institution = value['attributes']['institute'];
          var role = value['attributes']['role'];
          var startYear = value['attributes']['startDate'].substr(0,4);
          var endYear = value['attributes']['endDate'].substr(0,4);
          fullLabel = label;
          other_positions.push({'label':fullLabel, 'startYear': startYear, 'endYear': endYear, 'institution': institution, 'orig_label': role });
      }
    });
    return {'otherPositions':other_positions}
    
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

    let defaultCitationFormat = 'nlmCitation'
    let figureCitation = function(value) {
      var citation = value.attributes[defaultCitationFormat]
            .replace(stripOpeningTag,"")
            .replace(stripClosingTag, "");

      citation = citation.replace(stripHtml, "");

      var doi = value.attributes['doi'];
      if (typeof doi !== 'undefined') {
        citation = citation + " doi:" + doi + ".";
      }
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
      let uri = value['uri'];

      var role = "";
      switch(value['attributes']['authorshipType']) 
      {
         case 'http://vivoweb.org/ontology/core#Contributorship':
            role = "contributor"
            break;

          case 'http://vivoweb.org/ontology/core#Contribution':
            role = "contributor"
            break;
            
          case 'http://vivoweb.org/ontology/core#Translatorship':
            role = "translator"
            break;

          case 'http://vivoweb.org/ontology/core#Editorship':
            role = "editor"
            break;

          case 'http://vivoweb.org/ontology/core#Authorship':
            role = "author"
            break;

          default:
            role = ""
            break;
      }

      var year = value['attributes']['year'];
       // substring year for first 4 digits
      if(year != ''){
         year = year;
      }

      var subtypes = value['attributes']['subtypes'];
      let subtypeList = [];

      // 1) If subtypes have multiple, split by ';'
      if(subtypes != ''){
        // often just list of 1
        subtypeList = subtypes.split(';')
      }

      let orderOfMagnitude = ["Multicenter Study", "Adaptive Clinical Trial", "Clinical Trial, Phase III",
        "Clinical Trial, Phase IV", "Pragmatic Clinical Trial", "Review", "Scientific Integrity Review", 
        "Systematic Review", "Support of Research Systematic Review", "Journal Article", "Editorial", 
        "Letter", "English Abstract"
      ]

      // 2) sort by 'order of magnitute'
      subtypeList.sort(function(a, b) {
         return orderOfMagnitude.indexOf(a) - orderOfMagnitude.indexOf(b)
      })

      let isRefereed = function() {
        let exclusion = ["Review",  "Scientific Integrity Review",
          "Systematic Review", "Support of Research Systematic Review"]
        let inclusion = ["Journal Article", "Journal", "academic article"]
        return subtypeList.length == 0 || 
        ((_.intersection(subtypeList, inclusion).length > 0 &&
        !(_.intersection(subtypeList, exclusion).length > 0))
        ) && value['vivoType'] == 'http://purl.org/ontology/bibo/AcademicArticle'
      }

      let isManuscript = function() {
        let inclusion = ["Multicenter Study", "Adaptive Clinical Trial", 
          "Clinical Trial, Phase III", "Clinical Trial, Phase IV", "Pragmatic Clinical Trial"]
        // NOTE: include AND pattern (instead of !exclude AND - like a lot of others)
        return ((_.intersection(subtypeList, inclusion).length > 0) && _.includes(subtypeList, 'Journal Article'))
          || _.includes(subtypeList, "Multicenter Study")
      }

      let isLetter = function() {
        let exclusion = ["Multicenter Study", "Adaptive Clinical Trial", "Clinical Trial, Phase III",
          "Clinical Trial, Phase IV", "Pragmatic Clinical Trial", "Journal Article", "Journal"]
         return !(_.intersection(subtypeList, exclusion).length > 0) && _.includes(subtypeList, 'Letter')
      }
      let isEditorial = function() {
        let exclusion = ["Multicenter Study", "Adaptive Clinical Trial", "Clinical Trial, Phase III",
            "Clinical Trial, Phase IV", "Pragmatic Clinical Trial", "Review", "Scientific Integrity Review",
            "Systematic Review", "Support of Research Systematic Review", "Journal Article", "Journal"]
          return !(_.intersection(subtypeList, exclusion).length > 0) &&
             (_.includes(subtypeList, 'Editorial') || _.includes(subtypeList, 'Editorial Comment'))
      }
      let isAbstract = function() {
        let exclusion = ["Multicenter Study", "Adaptive Clinical Trial", "Clinical Trial, Phase III", 
          "Clinical Trial, Phase IV", "Pragmatic Clinical Trial", "Review", "Scientific Integrity Review",
          "Systematic Review", "Support of Research Systematic Review", "Journal Article", "Editorial",
          "Letter"]
        return !(_.intersection(subtypeList, exclusion).length > 0) && _.includes(subtypeList, 'English Abstract')
      }
      let isReview = function() {
        let checkList = ["Multicenter Study", "Adaptive Clinical Trial", "Clinical Trial, Phase III", 
          "Clinical Trial, Phase IV", "Pragmatic Clinical Trial"]
        let inclusion = ["Review", "Scientific Integrity Review", "Systematic Review", "Support of Research Systematic Review"]
        return !(_.intersection(subtypeList, checkList).length > 0) && (_.intersection(subtypeList, inclusion).length > 0)
      }


      // NOTE: uri column is added for debugging/tracing purposes - not used on CV
      if(isRefereed()) {
        if(value['vivoType'] == 'http://purl.org/ontology/bibo/AcademicArticle') {
          pubTypes['journals'].push({'citation': citation, 'year': year, 'subtypes': subtypeList, 'uri': uri})
        }
      }
      if(isManuscript()) {
        pubTypes['manuscripts'].push({'citation': citation, 'year': year, 'subtypes': subtypeList, 'uri': uri})
      }
      if(isLetter()) {
        pubTypes['letters'].push({'citation': citation, 'year': year, 'subtypes': subtypeList, 'uri': uri})
      }
      if(isEditorial()) {
        pubTypes['editorials'].push({'citation': citation, 'year': year, 'subtypes': subtypeList, 'uri': uri})
      }
      if(isAbstract()) {
        pubTypes['abstracts'].push({'citation': citation,'year': year, 'subtypes': subtypeList, 'uri': uri})
      }
      if(isReview()) {
        pubTypes['reviews'].push({'citation': citation, 'year': year, 'subtypes': subtypeList, 'uri': uri})
      }
      if(value['vivoType'] == 'http://purl.org/ontology/bibo/Book') {
        pubTypes['books'].push({'citation': citation, 'year': year, 'subtypes': subtypeList, 'uri': uri})
      }
      if (value['vivoType'] == 'http://purl.org/ontology/bibo/BookSection') {
        pubTypes['booksections'].push({'citation': citation, 'year': year, 'subtypes': subtypeList, 'uri': uri})
      }
    
      /* NOTE: 'nonauthored' and 'others' not populated */
    });
    pubTypes['books_booksections'] = pubTypes['books'].concat(pubTypes['booksections'])
    pubTypes['journals'] = pubTypes['journals'].concat(pubTypes['manuscripts'], pubTypes['letters'], pubTypes['editorials'], pubTypes['reviews'])
    let results = _.transform(pubTypes, (result, value, key) => { 
      let name = key
      result[name] = value
      return result;
    }, {});

    return results
  }

  parseConsultantAppointments(data) {

    var consultAppointmentsList = { 'community_service': [], 'editorial_activities': [], 'prof_editorial_activities': [], 'professional_development': [], 'event_attendance': [], 'lectures': [], 'consulting': [], 'prof_consulting': [], 'other_activities': [], 'event_admin': [], 'committee_service': [], 'full_org_and_participation_list': [] };
    let professionalActivities = data['professionalActivities'];

     _.forEach(professionalActivities, function(value) {
        
        if( value['vivoType'] == 'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#ServiceToTheProfession' || value['vivoType'] == 'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#ServiceToTheUniversity') {
             
             var label = value['label'];     
             var serviceType = value.attributes['serviceType'];
             var startDate = new Date(value.attributes['startDate']);
             var endDate = new Date(value.attributes['endDate']);
             let vivoType = value['vivoType'];
             
             switch(serviceType) {

                case "Community Service": {
                    consultAppointmentsList['community_service'].push({'label':label, 'date':startDate});
                    if( value['vivoType'] != 'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#ServiceToTheUniversity'){
                      consultAppointmentsList['full_org_and_participation_list'].push({'label':label, 'date':startDate});
                    }
                    break;
                }

                case "Editorial Activities": {
                    consultAppointmentsList['editorial_activities'].push({'label':label, 'date':startDate});
                    if( value['vivoType'] == 'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#ServiceToTheProfession'){
                      consultAppointmentsList['prof_editorial_activities'].push({'label':label, 'date':startDate});
                    }
                    break;
                }

                case "Professional Development": {
                    consultAppointmentsList['professional_development'].push({'label':label, 'date':startDate});
                    if( value['vivoType'] != 'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#ServiceToTheUniversity'){
                      consultAppointmentsList['full_org_and_participation_list'].push({'label':label, 'date':startDate});
                    }
                    break;
                }

                case "Event Attendance": {
                  consultAppointmentsList['event_attendance'].push({'label':label, 'date':startDate});
                  if( value['vivoType'] != 'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#ServiceToTheUniversity'){
                    consultAppointmentsList['full_org_and_participation_list'].push({'label':label, 'date':startDate});
                  }
                  break;
                }

                case "Lecture": {
                    consultAppointmentsList['lectures'].push({'label':label, 'date':startDate});
                    if( value['vivoType'] != 'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#ServiceToTheUniversity'){
                      consultAppointmentsList['full_org_and_participation_list'].push({'label':label, 'date':startDate});
                    }
                    break;
                }

                case "Consulting": {
                    consultAppointmentsList['consulting'].push({'label':label, 'date':startDate});
                    if( value['vivoType'] == 'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#ServiceToTheProfession'){
                      label = label.replace(/\./g,',');
                      consultAppointmentsList['prof_consulting'].push({'label':label, 'date':startDate});
                    }
                    break;
                }

                case "Consultant": {
                    consultAppointmentsList['consulting'].push({'label':label, 'date':startDate});
                    break;
                }

                case "Other": {
                    consultAppointmentsList['other_activities'].push({'label':label, 'date':startDate});
                    if( value['vivoType'] != 'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#ServiceToTheUniversity'){
                      consultAppointmentsList['full_org_and_participation_list'].push({'label':label, 'date':startDate});
                    }
                    break;
                }

                case "Event/Organization Administration": {
                    consultAppointmentsList['event_admin'].push({'label':label, 'date':startDate});
                    if( value['vivoType'] != 'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#ServiceToTheUniversity'){
                      consultAppointmentsList['full_org_and_participation_list'].push({'label':label, 'date':startDate});
                    }
                    break;
                }

                case "Committee Service": {
                    consultAppointmentsList['committee_service'].push({'label':label, 'date':startDate});
                    if( value['vivoType'] != 'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#ServiceToTheUniversity'){
                      consultAppointmentsList['full_org_and_participation_list'].push({'label':label, 'date':startDate});
                    }
                    break;
                }

                default:
                  break;
              }
         }

      });

    let results = _.transform(consultAppointmentsList, (result, value, key) => { 
      let name = key
      result[name] = value
      return result;
    }, {});
    return results 
  }

  parseScholarlySocieties(data) {
    let awards = data['awards'];
    var scholarlySocietiesList = [];
    _.forEach(awards, function(value) {
      if(value['attributes']['serviceType'] == 'Scholarly Society') {
        var label = value['label'];
        var date = value['attributes']['date'].substr(0,4);
        var ssDate = new Date(value['attributes']['date']);
        var label = (label + " " + date);   
        scholarlySocietiesList.push({'label':label, 'date':ssDate});
      }
    });
    return {'scholarlySocieties': scholarlySocietiesList}
  };

  parseAwards(data) {
    let awards = data['awards'];
    var awardList = [];
    _.forEach(awards, function(value) {
      if(value['attributes']['serviceType']  != 'Scholarly Society') {
        var label = value['label'];
        var date = value['attributes']['date'].substr(0,4);
        var label = (label + " " + date);   
        awardList.push({'label':label});
      }
    });
    return {'awards': awardList}
  };

  parseGrants(data) {
    let label = data['label']   
    let grants = data['grants'] || [];
    let gifts = data['gifts'] || [];

    let currentGrantList = []
    let completedGrantList = []
    let pendingGrantList = []
    let otherGrantList = [] // NOTE: this should be empty

    _.forEach(grants, function(value) {
      let uri = value['uri']
      let startDate = new Date(value.attributes['startDate']);
      let endDate = new Date(value.attributes['endDate']);
      let today = new Date();
       
      let startYear = startDate.getFullYear();
      let endYear = endDate.getFullYear();
      let period = startYear + " - " + endYear;
      let title = value['label'];
      let awardedBy = value.attributes['awardedBy'];
      let role = value.attributes['roleName'];
      let pi = value.attributes['piName'];
 
      var summary = {
        'pi': pi, 
        'period': period, 
        'title': title, 
        'awardedBy': awardedBy,
        'role': role,
        'uri': uri,
        'startYear': startYear,
        'endYear': endYear,
        'type': 'Grant' // just to debug, since they are mixed as one
      }

      if(startDate < today && endDate > today) {
         currentGrantList.push(summary)
      } else if(endDate < today) {
         completedGrantList.push(summary)
      } else if(startDate > today) {
         pendingGrantList.push(summary)
      } else {
        // catching missed
        otherGrantList.push(summary)
      }
    });

    _.forEach(gifts, function(value) {
      let uri = value['uri']
      let startDate = new Date(value.attributes['dateTimeStart']);
      
      let dateTimeEnd = value.attributes['dateTimeEnd'] || value.attributes['dateTimeStart']
      let endDate = new Date(dateTimeEnd); // end can be null, so defaulting to same as start
      
      let today = new Date();

      let startYear = startDate.getFullYear();
      let endYear = endDate.getFullYear();
      let period = (startYear == endYear) ? startYear : startYear + " - " + endYear;
      let title = value['label'];
      let awardedBy = value.attributes['donor'];
      let role = value.attributes['role'];

      let roleDescription = function(role) {
        switch (role) {
          case "PI": return "Principal Investigator"
          case "Co-PI": return "Co-Principal Investigator" 
          default: return role
        }
      }
      // NOTE: there is no 'piName' attribute for gifts
      let pi = (role == "PI") ? label : ""
      let summary = {
        'pi': pi, 
        'period': period, 
        'title': title,
        'awardedBy': awardedBy,
        'role': roleDescription(role),
        'uri': uri,
        'startYear': startYear,
        'endYear': endYear,
        'type': 'Gift'
      }

      if(startDate < today && endDate > today) {
         currentGrantList.push(summary)
      } else if(endDate < today) {
         completedGrantList.push(summary)
      } else if(startDate > today) {
         pendingGrantList.push(summary)
      } else {
        // catching missed
        otherGrantList.push(summary)
      }
    });

    // NOTE: need to sort once all are collected
    // reverse chronological order, first by end date and next by start date
    currentGrantList = _.orderBy(currentGrantList, ['endYear', 'startYear'], ['desc', 'desc']);
    completedGrantList = _.orderBy(completedGrantList, ['endYear', 'startYear'], ['desc', 'desc']);
    pendingGrantList = _.orderBy(pendingGrantList, ['endYear', 'startYear'], ['desc', 'desc']);

    let results = {
      'currentGrants': currentGrantList, 
      'completedGrants': completedGrantList, 
      'pendingGrants': pendingGrantList,
      'otherGrants': otherGrantList
    }
    return results
  };

  parsementorshipOverview(data) {
    let overview = data['attributes']['mentorshipOverview'] || null;
    var mentorship_activities = null

    if (overview != null) {
      var mentorship_activities = overview;
      //mentorship_activities =  mentorship_activities.replace(/(&nbsp;)*/g,"");
      //mentorship_activities =  mentorship_activities.replace(/[<]br[^>]*[>]/gi,"");
    }
    return {'mentorship_activities': mentorship_activities}
  };

  parseteachingActivities(data) {
    let activities = data['attributes']['teachingActivities'] || null;
    var teaching_activities = null

    if (activities != null) {
      var teaching_activities = activities;
      //var teaching_activities = activities.replace(stripHtml, "");
      //teaching_activities =  teaching_activities.replace(/(&nbsp;)*/g,"");
      //teaching_activities =  teaching_activities.replace(/[<]br[^>]*[>]/gi,"");
    }
    return {'teaching_activities': teaching_activities}
  };

  parsePresentations(data) {

    var presentationList = { 'keynotenamedlectures': [], 'professorships': [], 'nationalmeetings': [], 'courses': [], 'internationalmeetings': [], 'invitedtalks': [], 'lectures': [], 'broadcastappearances': [], 'interviews': [], 'otherPresentations': [] };
    let professionalActivities = data['professionalActivities'];

     _.forEach(professionalActivities, function(value) {
        
        if( value['vivoType'] == 'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#Presentation' ) {
             
             var label = value['label'];     
             var serviceType = value.attributes['serviceType'];
             let vivoType = value['vivoType'];
             
             switch(serviceType) {

                case "Other": {
                    //NOTE: 'other' skipped
                    presentationList['otherPresentations'].push({'label':label});
                    break;
                }

                case "Instructional Course, Workshop, or Symposium": {
                    presentationList['courses'].push({'label':label});
                    break;
                }

                case "Lecture": {
                  presentationList['lectures'].push({'label':label});
                  break;
              }
                
                case "Invited Talk": {
                  presentationList['invitedtalks'].push({'label':label});
                  break;
              }

              case "Broadcast Appearance": {
                presentationList['broadcastappearances'].push({'label':label});
                break;
            }

              case "Interview": {
                presentationList['interviews'].push({'label':label});
                break;
            }

                case "National Scientific Meeting": {
                    presentationList['nationalmeetings'].push({'label':label});
                    break;
                }

                case "Keynote/Named Lecture": {
                    presentationList['keynotenamedlectures'].push({'label':label});
                    break;
                }

                case "International Meeting or Conference": {
                    presentationList['internationalmeetings'].push({'label':label});
                    break;
                }

                case "Visiting Professorship Lecture": {
                     presentationList['professorships'].push({'label':label});
                     break;
                }

                default:
                  break;
              }
         }

      });

    let results = _.transform(presentationList, (result, value, key) => { 
      let name = key
      result[name] = value
      return result;
    }, {});

    return results

  }

  parseClinicalActivities(data) {
    let activities = data['attributes']['clinicalOverview'] || null;
    var clinical_activities = null

    if (activities != null) {
      var clinical_activities = activities;
      //clinical_activities = clinical_activities.replace(/(&nbsp;)*/g,"");
      //clinical_activities =  clinical_activities.replace(/[<]br[^>]*[>]/gi,"");
    }
    return {'clinical_activities': clinical_activities}
  };

  parseacademicActivities(data) {
    let activities = data['attributes']['academicActivities'] || null;
    var academic_activities = null

    if (activities != null) {
      var academic_activities = activities;
      //academic_activities = academic_activities.replace(/(&nbsp;)*/g,"");
      //academic_activities =  academic_activities.replace(/[<]br[^>]*[>]/gi,"");
    }
    return {'academic_activities': academic_activities}
  };

  convert(data) {
    var results = {}

    _.merge(results, this.parseName(data))
    _.merge(results, this.parsePhone(data))
    _.merge(results, this.parseEmail(data))
    _.merge(results, this.parseTitle(data))
    _.merge(results, this.parseEducations(data))
    _.merge(results, this.parsePositions(data))
    _.merge(results, this.parseOtherPositions(data))
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
  WidgetsPubMedParser
}





