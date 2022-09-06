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

  formatDatePrecision(date, precision) {
      var monthNames = ["January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"];
 
      var year = date.getFullYear() 
      if (precision == "http://vivoweb.org/ontology/core#yearMonthPrecision") {
        var month = monthNames[date.getMonth()]
        return `${month} ${year}`;
      } else if (precision == "http://vivoweb.org/ontology/core#yearMonthDayPrecision") {
        var month = monthNames[date.getMonth()]
        var day = date.getDate()
        return `${month} ${day}, ${year}`
      } else if (precision == "http://vivoweb.org/ontology/core#yearPrecision") {
          return `${year}`
      } else {
          return `${year}`
      }
      return "" // if no match
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
      // FDP-3864: add org to label
      var orgLabel = value['attributes']['organizationLabel'];
      var apptLabel = label + ', ' + orgLabel;
      switch(vivoType) {
        case positionTypes['primaryPosition']: {
          primaryPositions.push({'label': apptLabel})
          break;
        }
        case positionTypes['secondaryPosition']: {
          secondaryPositions.push({'label': apptLabel})
          break;
        }
        default: {
          secondaryPositions.push({'label': apptLabel})
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


  parseOtherPositions(data) {
    let otherPositions = data['academicPositions'] || [];
    var other_positions = [];
    _.forEach(otherPositions, function(value) {
      if(value['vivoType'] == 'http://vivo.duke.edu/vivo/ontology/duke-cv-extension#NonDukePosition')
      {
          var full_label = "";
          var label = value['label'];
          var startYear = value['attributes']['startDate'].substr(0,4);
          var endYear = value['attributes']['endDate'].substr(0,4);
          var full_label = label + ". " + startYear + " - " + endYear;
          other_positions.push({'label':full_label});
      }
    });
    return {'otherPositions':other_positions}
  };


  parseEducations(data) {
    var educations = data['educations'] || [];
    var educationList = []

    _.forEach(educations, function(value) {
      let institution = value.attributes['institution'];
      let endYear = value.attributes['endDate'] ? value.attributes['endDate'].substr(0,4) : '';
      let label = value['label'];

      var degree = value.attributes['degree'];
      var fullLabel = ""

      if (typeof degree != 'undefined') {
        var degree = value.attributes['degree'];
        fullLabel = (degree + ", " + institution);
        if (endYear != '') {
          fullLabel = (fullLabel + " " + endYear);
        }
      }
      else {
        fullLabel = (label + ", " + institution);
        if (endYear != '') {
          fullLabel = (fullLabel + " " + endYear);
        }
      }
      educationList.push({'label': fullLabel, 'endYear': endYear})
    });

    let results = {'educations': educationList.reverse()}
    return results
  }


  parseCurrentResearchInterests(data) {
    let overview = data['interestsOverview'] || null;
    var currentResearchInterests = null

    if (overview != null) {
      var current_research_interests = overview.replace(stripHtml, "");
    }
    return {'currentResearchInterests': currentResearchInterests}
  }

  parseResearchInterests(data) {
    let overview = data['attributes']['overview'] || null;
    var researchInterests = null

    if (overview != null) {
      var research_interests = overview.replace(stripHtml, "");
    }
    return {'researchInterests': researchInterests}
  }


  parsePublications(data) {
    /// matches a 'preferredCitationFormat' entry with the publication attribute e.g.
    // if someone has #chicagoCitation as preferred, should pull value.attributes['chicagoCitation']
    // as the citation
    var citationTypes = {
      'http://vivo.duke.edu/vivo/ontology/duke-extension#chicagoCitation': 'chicagoCitation',
      'http://vivo.duke.edu/vivo/ontology/duke-extension#mlaCitation': 'mlaCitation',
      'http://vivo.duke.edu/vivo/ontology/duke-extension#nlmCitation': 'nlmCitation',
      'http://vivo.duke.edu/vivo/ontology/duke-extension#apaCitation': 'apaCitation',
      'http://vivo.duke.edu/vivo/ontology/duke-extension#icmjeCitation': 'icmjeCitation'
    }
    
    var pubTypes = {
      'http://purl.org/ontology/bibo/AcademicArticle': [],
      'http://purl.org/ontology/bibo/Book': [],
      'http://vivoweb.org/ontology/core#Review': [],
      'http://purl.org/ontology/bibo/BookSection': [],
      'http://vivo.duke.edu/vivo/ontology/duke-extension#BookSeries': [],
      'http://vivoweb.org/ontology/core#ConferencePaper': [],
      'http://vivoweb.org/ontology/core#Dataset': [],
      'http://vivo.duke.edu/vivo/ontology/duke-extension#DigitalPublication': [],
      'http://vivo.duke.edu/vivo/ontology/duke-extension#JournalIssue': [],
      'http://purl.org/ontology/bibo/Report': [],
      'http://purl.org/ontology/bibo/EditedBook': [],
      'http://purl.org/ontology/bibo/Thesis': [],
      'http://vivo.duke.edu/vivo/ontology/duke-extension#OtherArticle': [],
      'http://vivoweb.org/ontology/core#Software': [],
      'http://vivo.duke.edu/vivo/ontology/duke-extension#Preprint': [],
    };

    var publications = data['publications'] || [];
    // default to mla
    var preferredCitationFormat = data['attributes']['preferredCitationFormat'] || 'http://vivo.duke.edu/vivo/ontology/duke-extension#mlaCitation';

    // another default to mla just in case
    var citationAttribute = citationTypes[preferredCitationFormat] || 'mlaCitation'

    let figureCitation = function(value) {

      var vivoType = value['vivoType'];

      if (Object.keys(pubTypes).indexOf(vivoType) > -1) {

          var citation = value.attributes[citationAttribute]
              .replace(stripOpeningTag,"")
              .replace(stripClosingTag, "");

          citation = citation.replace(stripHtml, "");

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

      if(typeof citation !== 'undefined') {
        pubTypes[vivoType].push({'citation': citation})
      }

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
    awards.forEach((value) => {
      var label = value['label']
      // FIXME: can any, all of these be null?
      var service = value['attributes']['serviceType']
      var awardedBy = value['attributes']['awardedBy']
      var name = value['attributes']['name']
      var date = new Date(value['attributes']['date'])
      var precision = value['attributes']['datePrecision']
      var dateFormatted = this.formatDatePrecision(date, precision)
      var award = `${name} (${service}). ${awardedBy}. ${dateFormatted}. `
      awardList.push({'label': award});
    });
    return {'awards': awardList}
  };

  parseProfessionalActivities(data) {
    var professionalActivitiesTypes = {
      'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#Presentation': [],
      'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#ServiceToTheProfession': [],
      'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#ServiceToTheUniversity' : [],
      'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#Outreach' : []
    }
    var professionalActivities = data['professionalActivities'];
 
    let presentationLabel = (value) => {
      var full_label = value.attributes['nameOfTalk'];
      
      if (typeof value.attributes['serviceOrEventName'] != 'undefined') {
        full_label += ". " + value.attributes['serviceOrEventName'];
      }

      if (typeof value.attributes['hostOrganization'] != 'undefined') {
        full_label  += ". " + value.attributes['hostOrganization'];
      }

      if (typeof value.attributes['locationOrVenue'] != 'undefined') {
        full_label += ". " + value.attributes['locationOrVenue'];
      }

      var start_date = new Date(value.attributes['startDate']);
      var start_date_precision = value.attributes["startDatePrecision"]

      let startFormatted = this.formatDatePrecision(start_date, start_date_precision)
      if (typeof end_date != 'undefined') {
        var end_date = new Date(value.attributes['endDate']);
        var end_date_precision = value.attributes["endDatePrecision"]
        let endFormatted = this.formatDatePrecision(end_date, end_date_precision)
        full_label += ". " + startFormatted + " - " + endFormatted
      } else {
        full_label += ". " + startFormatted
      }
      return full_label;
    }
    let serviceToProfessionLabel = (value) => {
      var full_label = value.attributes['role']; // always role?
      
      if (typeof value.attributes['serviceOrEventName'] != 'undefined') {
        full_label += ". " + value.attributes['serviceOrEventName'];
      }

      if (typeof value.attributes['hostOrganization'] != 'undefined') {
        full_label  += ". " + value.attributes['hostOrganization'];
      }

      if (typeof value.attributes['locationOrVenue'] != 'undefined') {
        full_label += ". " + value.attributes['locationOrVenue'];
      }

      var start_date = new Date(value.attributes['startDate']);
      var start_date_precision = value.attributes["startDatePrecision"]

      let startFormatted = this.formatDatePrecision(start_date, start_date_precision)
      if (typeof end_date != 'undefined') {
        var end_date = new Date(value.attributes['endDate']);
        var end_date_precision = value.attributes["endDatePrecision"]
        let endFormatted = this.formatDatePrecision(end_date, end_date_precision)
        full_label += ". " + startFormatted + " - " + endFormatted
      } else {
        full_label += ". " + startFormatted
      }
      return full_label;
 
      return full_label;
    }
    let serviceToUniversityLabel = (value) => {
      // NOTE: has to be either 'role' or 'committeeName and committeeType'
      var full_label = ''
      if (typeof value.attributes['role'] != 'undefined') {
        let role = value.attributes['role']
        full_label = `${role}`
      } else {
        let committeeName = value.attributes['committeeName']
        let committeeType = value.attributes['committeeType']
        full_label = `${committeeName}. ${committeeType}`
      }
      if (typeof value.attributes['serviceOrEventName'] != 'undefined') {
        full_label += ". " + value.attributes['serviceOrEventName'];
      }

      if (typeof value.attributes['hostOrganization'] != 'undefined') {
        full_label  += ". " + value.attributes['hostOrganization'];
      }

      if (typeof value.attributes['locationOrVenue'] != 'undefined') {
        full_label += ". " + value.attributes['locationOrVenue'];
      }

      var start_date = new Date(value.attributes['startDate']);
      var start_date_precision = value.attributes["startDatePrecision"]
      let startFormatted = this.formatDatePrecision(start_date, start_date_precision)
      
      if (typeof value.attributes['endDate'] != 'undefined') {
        var end_date = new Date(value.attributes['endDate']);
        var end_date_precision = value.attributes["endDatePrecision"]
        let endFormatted = this.formatDatePrecision(end_date, end_date_precision)
        full_label += ". " + startFormatted + " - " + endFormatted
      } else {
        full_label += ". " + startFormatted
      }
      return full_label;
    }
    let outreachLabel = (value) => {
      var full_label = value.attributes['role']; // always role?
      if (typeof value.attributes['serviceOrEventName'] != 'undefined') {
        full_label += ". " + value.attributes['serviceOrEventName'];
      }

      if (typeof value.attributes['hostOrganization'] != 'undefined') {
        full_label  += ". " + value.attributes['hostOrganization'];
      }

      if (typeof value.attributes['locationOrVenue'] != 'undefined') {
        full_label += ". " + value.attributes['locationOrVenue'];
      }

      if (typeof value.attributes['geoFocus'] != 'undefined') {
        full_label += ". " + value.attributes['geoFocus'];
      }
 
      var start_date = new Date(value.attributes['startDate']);
      var start_date_precision = value.attributes["startDatePrecision"]
      let startFormatted = this.formatDatePrecision(start_date, start_date_precision)
 
      full_label += ". " + startFormatted
      return full_label;
    }

    let figureProfessionalActivity = (vivoType, value) => {
      /*
       *
      does each one have a different 'label' procedure?
      'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#Presentation': [],
      'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#ServiceToTheProfession': [],
      'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#ServiceToTheUniversity' : [],
      'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#Outreach' : []
      */
      var full_label = ""
      switch (vivoType) {
        case 'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#Presentation': {
          return presentationLabel(value) 
        }
        case 'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#ServiceToTheProfession': {
          return serviceToProfessionLabel(value)
        }
        case 'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#ServiceToTheUniversity': {
          return serviceToUniversityLabel(value)
        }
        case 'http://vivo.duke.edu/vivo/ontology/duke-activity-extension#Outreach': {
          return outreachLabel(value)
        }
        default:
          // are those 4 all the types?
          console.error(`do not know how to create label for ${vivoType}`)
          return value['label']
      }
      return full_label
    }
    
    professionalActivities.forEach((value) => {
      let serviceType = value.attributes['serviceType'];
      let vivoType = value['vivoType'];

      let label = figureProfessionalActivity(vivoType, value);
      professionalActivitiesTypes[vivoType].push({'label': label}) // should be array
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
          return "presentations"
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

  parseClinicalActivities(data) {
    let activities = data['attributes']['clinicalOverview'] || null;
    var clinical_activities = null

    if (activities != null) {
      var clinical_activities = activities;
    }
    return {'clinical_activities': clinical_activities}
  };

  parseLeadershipPositions(data) {
    let positions = data['attributes']['leadershipPositions'] || null;
    var leadership_positions = null

    if (positions != null) {
      var leadership_positions = positions;
    }
    return {'leadership_positions': leadership_positions}
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

  parseTeachingActivities(data) {
    let activities = data['attributes']['teachingActivities'] || null;
    var teaching_activities = null

    if (activities != null) {
      var teaching_activities = activities;
    }
    return {'teaching_activities': teaching_activities}
  };

  parseMentorshipOverview(data) {
    let overview = data['attributes']['mentorshipOverview'] || null;
    var mentorship_activities = null

    if (overview != null) {
      var mentorship_activities = overview;
    }
    return {'mentorship_activities': mentorship_activities}
  };

  parseAcademicActivities(data) {
    let activities = data['attributes']['academicActivities'] || null;
    var academic_activities = null

    if (activities != null) {
      var academic_activities = activities;
    }
    return {'academic_activities': academic_activities}
  };

  parseArtisticEvents(data) {
    let artisticEvents = data['artisticEvents'];
    var artisticEventsList = [];
    artisticEvents.forEach((value) => {
      var label = value['label'];
      label = label.replace(" |", ",");

      var start_year = value['attributes']['startYear'] // always present?
      var end_year = value['attributes']['endYear'] || null // can be null

      var venue = value['attributes']['venue'];

      if(end_year){
        label = label + ". " + start_year.substr(0,4) + " - " + end_year.substr(0,4);
      }
      else{
        label = label + ". " + start_year.substr(0,4);
      }

      // startYear is used for sorting
      artisticEventsList.push({'label':label, 'startYear':start_year });
    });
    return {'artisticEvents': artisticEventsList}
  };

  parseArtisticWorks(data) {
    var artisticWorkTypes = {
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#AudioRecording': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#Ceramic': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#Composition': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#Choreography': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#MusicalComposition': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#CostumeDesign': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#DanceProduction': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#DecorativeArt': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#DigitalMedia': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#Drawing': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#Exhibit': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#Film': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#GraphicDesign': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#Illustration': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#Installation': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#LightingDesign': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#MotionGraphics': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#MuseumCollection': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#MusicalPerformance': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#NewMedia': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#Painting': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#Photograph': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#Print': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#RadioTelevisionProgram': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#RepertoirePortfolio': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#Script': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#Sculpture': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#SetDesign': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#SoundDesign': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#TheatricalProduction': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#VideoRecording': [],
      'http://vivo.duke.edu/vivo/ontology/duke-art-extension#MultipleTypes': []
    };


    var artisticWorks = data['artisticWorks'] || [];

    let figureArtisticWork = (value) => {
      let date = new Date(value.attributes["date"]);
      let precision = value.attributes["date_precision"];
      let dateFormatted = this.formatDatePrecision(date, precision)
      let commissioned = value.attributes["commissioning_body"] || null
      let link = value.attributes["link_url"] || null

      var artisticWork = `${value["label"]} (${value.attributes["role"]}). `;
      if (commissioned) {
        artisticWork = artisticWork + `Commissioned by ${commissioned}. `
      }
      artisticWork = artisticWork + `${dateFormatted} . `
      if (link) {
        artisticWork = artisticWork + `${link}`
      }
      let vivoType = value['vivoType'];
      return artisticWork
    };

    _.forEach(artisticWorks, function(value) {

      let artisticWork = figureArtisticWork(value)
      let vivoType = value['vivoType'];

      artisticWorkTypes[vivoType].push({'artisticWork': artisticWork})

    });


    let results = _.transform(artisticWorkTypes, (result, value, key) => {
      let name = this.shortName(key)
      result[name] = value
      return result;
    }, {});

    return results

  };

  parseWebpages(data) {
    var webpages = data['webpages'] || [];
    var weblinks = []
    webpages.forEach((value) => {
      let label = value['label']
      let linkUri = value.attributes['linkURI']
      let category = value.attributes['category']
      weblinks.push({'category': category, 'label':label, 'uri': linkUri})
    });
    let grouped = _.groupBy(weblinks, 'category')
    return {'weblinks': grouped}
  };

  parseGifts(data) {
    var gifts = data['gifts'] || [];
    var giftList = []

    _.forEach(gifts, function(value) {
        var title = value['label'];
        var role = value.attributes['role'];
        var donor = value.attributes['donor'];
        var end = value.attributes['dateTimeEndYear']
        var start = value.attributes['dateTimeStartYear']
     
        let label = `${title} - ${role}/${donor} (${start}-${end})` 
        giftList.push({'label': label})
    });
    // TODO: not sure if this is the goal
    let results = {'gifts': giftList }
    return results
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
    _.merge(results, this.parsepastAppointments(data))
    _.merge(results, this.parseTeachingActivities(data))
    _.merge(results, this.parseMentorshipOverview(data))
    _.merge(results, this.parseAcademicActivities(data))
    _.merge(results, this.parseOtherPositions(data))
    _.merge(results, this.parseArtisticEvents(data))
    _.merge(results, this.parseArtisticWorks(data))
    _.merge(results, this.parseClinicalActivities(data))
    _.merge(results, this.parseCurrentResearchInterests(data))
    _.merge(results, this.parseLeadershipPositions(data))
    _.merge(results, this.parseWebpages(data))
    _.merge(results, this.parseGifts(data))
 
    return results
  }

};


export {
  WidgetsParser
}


