var stripHtml = /(<([^>]+)>)/ig;
var stripOpeningTag = /<a\b[^>]*>/i;
var stripClosingTag = /<\/a>/i;

import _ from 'lodash'

// http://www.scottmessinger.com/2015/05/19/functional-programming-with-lodash/
// https://stackoverflow.com/questions/35590543/how-do-you-chain-functions-using-lodash
class WidgetsNIHParser {

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

  parsepreferredTitle(data){
    var preferred_title = data['attributes']['preferredTitle'];
    return {'preferredTitle': preferred_title }
  }

  parsePositions(data) {
    let positions = data['positions'] || [];
    var primaryPositions = []
    var secondaryPositions = []
    var variousPositions = []
    var allPositions = []

    let positionTypes = {
      'primaryPosition': 'http://vivoweb.org/ontology/core#PrimaryPosition',
      'secondaryPosition': 'http://vivo.duke.edu/vivo/ontology/duke-extension#SecondaryPosition'
    };

    // group by 'type'
    _.forEach(positions, function(value) {
      var vivoType = value['vivoType'];
      var label = value['label'];
      if (data['vivoType'] == "http://vivoweb.org/ontology/core#FacultyMember") {
        var year = value['attributes']['startYear'].substr(0,4);
      } else {
        var year = "";
      }
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
          variousPositions.push({'label':label})
          break;
        }
      }
      allPositions.push({'label':label, 'startYear': year})
    });

    let results = {
      'primaryPositions': primaryPositions,
      'secondaryPositions': secondaryPositions,
      'variousPositions': variousPositions,
      'allPositions': allPositions
    }

    return results
  };

  parseEducations(data) {
    var educations = data['educations'] || [];
    var educationList = []
    var profexpList = []
    _.forEach(educations, function(value) {
      let institution = value.attributes['institution'];
      let label = value['label'];
      let endDate = value.attributes['endDate'];
      let endYear = endDate ? endDate.substr(0,4) : '';
      var degree = value.attributes['degree'];
      var fullLabel = "";
      if (typeof degree != 'undefined') {
        var degree = value.attributes['degree'];
        fullLabel = (degree + ", " + institution);
        if (endYear != '') {
          fullLabel = (fullLabel + ", " + endYear);
        }
        educationList.push({'label': fullLabel, 'endYear': endYear, 'institution': institution, 'degree': degree, 'education': label, 'endDate': endDate})
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
      pastAppointmentsList.push({'label':label, 'orig_label':label, 'org_label':org_label, 'startYear':start_year, 'endYear':end_year});
    });
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
      var citation = value.attributes['icmjeCitation']
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

      var subtype = value['attributes']['subtypes'];
      // If subtypes have multiple of them, pick first one
      if(subtype != ''){
         if(subtype.indexOf(';') > -1){
            var index = subtype.indexOf(';');
            subtype = subtype.substr(0,index);
         }
      }

      var year = value['attributes']['year'];
       // substring year for first 4 digits
      if(year != ''){
         year = year;
      }

      if(subtype == '' || subtype == 'academic article') {
          pubTypes['journals'].push({'citation': citation, 'year': year})
      }
      if(subtype == 'Clinical Trial Manuscript' && role == "contributor") {
          pubTypes['manuscripts'].push({'citation': citation, 'year': year})
      }
      if(subtype == 'Letter') {
          pubTypes['letters'].push({'citation': citation, 'year': year})
      }
      if(subtype == 'Editorial' || subtype == 'Editorial Comment') {
          pubTypes['editorials'].push({'citation': citation, 'year': year})
      }
      if(subtype == 'Abstract') {
          pubTypes['abstracts'].push({'citation': citation,'year': year})
      }
      if(subtype == 'Review') {
          pubTypes['reviews'].push({'citation': citation, 'year': year})
      }
      if(value['vivoType'] == 'http://vivo.duke.edu/vivo/ontology/duke-extension#OtherArticle' || subtype == 'Addendum' || subtype == 'Blog' ||
        subtype == 'Corrigendum' || subtype == 'Essay' || subtype == 'Fictional Work' || subtype == 'Interview' ||
        subtype == 'Occasional writing' || subtype == 'Poetry' || subtype == 'Rapid Communication' || subtype == 'Scholarly Commentary' ||
        subtype == 'Working paper') {
          pubTypes['others'].push({'citation': citation, 'year': year})
      }
      if(subtype != 'Clinical Trial Manuscript' && role == "contributor") {
          pubTypes['nonauthored'].push({'citation': citation, 'year': year})
      }
      if(value['vivoType'] == 'http://purl.org/ontology/bibo/Book') {
         pubTypes['books'].push({'citation': citation, 'year': year})
      }
      if (value['vivoType'] == 'http://purl.org/ontology/bibo/BookSection') {
         pubTypes['booksections'].push({'citation': citation, 'year': year})
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

    var consultAppointmentsList = { 'community_service': [], 'editorial_activities': [], 'prof_editorial_activities': [], 'professional_development': [], 'lectures': [], 'consulting': [], 'prof_consulting': [], 'other_activities': [], 'event_admin': [], 'committee_service': [] };
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
                    break;
                }

                case "Lecture": {
                    consultAppointmentsList['lectures'].push({'label':label, 'date':startDate});
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
                    break;
                }

                case "Event/Organization Administration": {
                    consultAppointmentsList['event_admin'].push({'label':label, 'date':startDate});
                    break;
                }

                case "Committee Service": {
                    consultAppointmentsList['committee_service'].push({'label':label, 'date':startDate});
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
        var label = (date + " " + label);
        scholarlySocietiesList.push({'label':label, 'date':ssDate});
      }
    });
    return {'scholarlySocieties': scholarlySocietiesList}
  };

  parseAwards(data) {
    let awards = data['awards'];
    var awardList = [];
    _.forEach(awards, function(value) {
      //if(value['attributes']['serviceType']  != 'Scholarly Societies') {
        var label = value['label'];
        var only_label = label;
        var date = value['attributes']['date'].substr(0,4);
        var label = (date + " " + label);
        awardList.push({'label':label, 'year':date, 'only_label':only_label});
      //}
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
      var startYear = value.attributes['startDate'].substr(0,4);
      var endYear = value.attributes['endDate'].substr(0,4);

      var pi = value.attributes['piName'];
      var period = startDate.getFullYear() + " - " + endDate.getFullYear();
      var title = value['label'];
      var role = value.attributes['roleName'];
      var donor = value.attributes['awardedBy'];


      if(startDate < today && endDate > today)
      {
         currentGrantList.push({'pi': pi, 'period': period, 'title': title, 'role': role, 'startYear': startYear, 'donor': donor, 'endYear': endYear})
      }
      if(endDate < today)
      {
         completedGrantList.push({'pi': pi, 'period': period, 'title': title, 'role': role, 'startYear': startYear, 'donor': donor, 'endYear': endYear})
      }
      if(startDate > today)
      {
         pendingGrantList.push({'pi': pi, 'period': period, 'title': title, 'role': role, 'startYear': startYear, 'donor': donor, 'endYear': endYear})
      }
    });

    let results = {'currentGrants': currentGrantList, 'completedGrants': completedGrantList, 'pendingGrants': pendingGrantList }
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

  parseOverview(data) {
    let overview = data['attributes']['overview'] || null;
    var general_overview = null

    if (overview != null) {
      var general_overview = overview;
    }
    return {'overview': general_overview}
  };

  parseGifts(data){

    var gifts = data['gifts'] || [];
    var currentGiftList = []
    var completedGiftList = []
    var pendingGiftList = []

    _.forEach(gifts, function(value) {
      if(value['vivoType'] == 'http://vivo.duke.edu/vivo/ontology/duke-cv-extension#Gift')
      {
        var startDate = new Date(value.attributes['dateTimeStart']);
        var endDate = new Date(value.attributes['dateTimeEnd']);
        var startYear = value.attributes['dateTimeStartYear'];
        var today = new Date();

        var pi = '';
        var period = startDate.getFullYear() + " - " + endDate.getFullYear();
        var title = value['label'];
        var role = value.attributes['role'];
        var donor = value.attributes['donor'];

        if(startDate < today && endDate > today)
        {
           currentGiftList.push({'pi': pi, 'period': period, 'title': title, 'role': role, 'startYear': startYear, 'donor': donor})
        }
        if(endDate < today)
        {
           completedGiftList.push({'pi': pi, 'period': period, 'title': title, 'role': role, 'startYear': startYear, 'donor': donor})
        }
        if(startDate > today)
        {
           pendingGiftList.push({'pi': pi, 'period': period, 'title': title, 'role': role, 'startYear': startYear, 'donor': donor})
        }
      }
    });
    let results = {'currentGifts': currentGiftList, 'completedGifts': completedGiftList, 'pendingGifts': pendingGiftList }
    return results
  }

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

    var presentationList = { 'lectures': [], 'professorships': [], 'nationalmeetings': [], 'courses': [], 'internationalmeetings': [] };
    let professionalActivities = data['professionalActivities'];

     _.forEach(professionalActivities, function(value) {

        if( value['vivoType'] == 'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#Presentation' ) {

             var label = value['label'];
             var serviceType = value.attributes['serviceType'];
             let vivoType = value['vivoType'];

             switch(serviceType) {

                case "Other": {
                    // NOTE: 'other' is just skipped
                    break;
                }

                case "Instructional Course, Workshop, or Symposium": {
                    presentationList['courses'].push({'label':label});
                    break;
                }

                case "National Scientific Meeting": {
                    presentationList['nationalmeetings'].push({'label':label});
                    break;
                }

                case "Keynote/Named Lecture": {
                    presentationList['lectures'].push({'label':label});
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
    _.merge(results, this.parsepreferredTitle(data))
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
    _.merge(results, this.parseGifts(data))
    _.merge(results, this.parsementorshipOverview(data))
    _.merge(results, this.parseteachingActivities(data))
    _.merge(results, this.parsePresentations(data))
    _.merge(results, this.parseClinicalActivities(data))
    _.merge(results, this.parseacademicActivities(data))
    _.merge(results, this.parseOverview(data))
    return results
  }

};

export {
  WidgetsNIHParser
}
