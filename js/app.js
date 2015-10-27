var loadFile=function(url,callback){
  JSZipUtils.getBinaryContent(url,callback);
};
     
var run_template= function(data) {
  loadFile("cv_template.docx",function(err,content){
    if (err) { 
      console.debug(err);
      throw e
    };
    doc=new Docxgen(content);
    doc.setData(data);    
    doc.render(); //apply them (replace all occurences of {first_name} by Hipp, ...)
    out=doc.getZip().generate({type:"blob"}) //Output the document using Data-URI
    saveAs(out,"output.docx")
  });
};
  
var get_data = function() {
  var base_url = "https://scholars.duke.edu/widgets/api/v0.9/people/complete/all.jsonp?"; 
  var person_uri = "uri=https://scholars.duke.edu/individual/per3668152";
  var url = base_url + person_uri;
  $.ajax({
    url: url,
    cache: false,
    dataType: "jsonp",
    method: 'GET',
    }).done(function(data) { 

      //gets ride of html tags
      var stripHtml = /(<([^>]+)>)/ig;
      var stripOpeningTag = /<a\b[^>]*>/i;
      var stripClosingTag = /<\/a>/i;

      // encompassing hash
      var results = {'cv': [], 'educationsLabel': [],'educations': [], 'publicationsLabel': [], 'academicArticlesLabel': [], 'booksLabel': [], 
                     'bookReviewsLabel': [], 'bookSectionsLabel': [], 'bookSeriesLabel': [], 'conferencePapersLabel': [], 'datasetsLabel': [], 
                     'digitalPublicationsLabel': [], 'journalIssuesLabel': [], 'reportsLabel': [], 'scholarlyEditionsLabel': [], 'thesesLabel': [], 
                     'academicArticles': [], 'books': [], 'bookReviews': [], 'bookSections': [], 'bookSeries': [], 'conferencePapers': [], 'datasets': [], 
                     'digitalPublications': [], 'journalIssues': [], 'reports': [], 'scholarlyEdition': [], 'theses': [], 'teachingLabel': [], 'teaching': [], 
                     'grantsLabel': [], 'grants': [],'researchInterestsLabel': [], 'awardsLabel': [], 'awards': [], 'presentationsLabel': [], 'presentations': [], 
                     'servicesToProfessionLabel': [], 'servicesToProfession': [], 'servicesToDukeLabel': [], 'servicesToDuke': [], 'outreachLabel': [], 
                     'outreach': []
      };   
      var first_name = data['attributes']['firstName'];

      var last_name = data['attributes']['lastName'];

      var primary_position = data['positions'][0]['label'];

      var positions =  data['positions'];
      if (typeof positions[1] != 'undefined' && positions[1] != null && positions[1].length > 0) {
        results['cv']['secondaryPositionLabel'] = "Secondary Appointment:";
        var secondaryPosition = positions[1]['label'];
      };

      var title = data['title'];

      //educations
      var educations = data['educations'];
      if (typeof educations != 'undefined' && educations != null && educations.length > 0) {
        results['educationsLabel'] = "Education:";
        $.each(educations, function(index, value) {
          var institution = value.attributes['institution'];
          var year = value.attributes['endDate'].substr(0,4);
          if (typeof degree != 'undefined') {
            var degree = value.attributes['degree'];
            var allEducation = (degree + ", " + institution + " " + year);
          }
          else {
            var allEducation = (institution + " " + year);
          }
          results['educations'].push({'allEducation': allEducation});

        });
      };

      //research interests
      var overview = data['attributes']['overview'];
      if (typeof overview != 'undefined' && overview != null && overview.length > 0) {
        var research_interests = overview.replace(stripHtml, "");
        results['researchInterestsLabel'] = "Research Interests:";  
      };

      results['cv'].push({'first_name': first_name, 'last_name': last_name, 'primary_position': primary_position, 'secondaryPositionLabel': [], 
                          'secondaryPosition': [], 'title': title, 'research_interests': research_interests });

      //PUBLICATIONS
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
      };

      var pubs = data['publications'];
      if (typeof pubs != 'undefined' && pubs != null && pubs.length > 0) {
        results['publicationsLabel'][0] = "Publications:";
        $.each(pubs, function(index, value) {      
          var citation = value.attributes['mlaCitation'].replace(stripOpeningTag,"").replace(stripClosingTag, "");
          var citation = citation.replace(stripHtml, "");
          var vivoType = value['vivoType'];
          if (vivoType != null) {       
            switch (vivoType) {
              case pubTypes['academicArticles']:
                results['academicArticlesLabel'][0] = "Academic Articles";
                results['academicArticles'].push({'citation': citation});                    
                break;
              case pubTypes['books']:
                results['booksLabel'][0] = "Books";
                results['books'].push({'citation': citation});            
                break;
              case pubTypes['bookReviews']:
                results['bookReviewsLabel'][0] = "Book Reviews";
                results['bookReviews'].push({'citation': citation});          
                break;
              case pubTypes['bookSections']:
                results['bookSectionsLabel'][0] = "Book Sections";
                results['bookSections'].push({'citation': citation});          
                break;            
              case pubTypes['bookSeries']:
                results['bookSeriesLabel'][0] = "Book Series";
                results['bookSeries'].push({'citation': citation});             
                break;
              case pubTypes['conferencePapers']:
                results['conferencePapersLabel'][0] = "Conference Papers";
                results['conferencePapers'].push({'citation': citation});              
                break;
              case pubTypes['datasets']:
                results['datasetsLabel'][0] = "Datasets";
                results['datasets'].push({'citation': citation});
                break;
              case pubTypes['digitalPublications']:
                results['digitalPublicationsLabel'][0] = "Digital Publications";
                results['digitalPublications'].push({'citation': citation});              
                break;
              case pubTypes['journalIssues']:
                results['journalIssuesLabel'][0] = "Journal Issues";
                results['journalIssues'].push({'citation': citation});     
                break;
              case pubTypes['reports']:
                results['reportsLabel'][0] = "Reports";
                results['reports'].push({'citation': citation});
                break;
              case pubTypes['scholarlyEdition']:
                results['scholarlyEditionsLabel'][0] = "Scholarly Editions";
                results['scholarlyEdition'].push({'citation': citation});
                break;
              default:
                results['thesesLabel'][0] = "Theses and Dissertations";
                results['theses'].push({'citation':citation});
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
      };

      //GRANTS
      var grants = data['grants'];
      if (typeof grants != 'undefined' && grants != null && grants.length > 0) {
        results['grantsLabel'][0] = "Grants:";
        $.each(grants, function(index, value) {
          var label = value['label'] + ", awarded by "
          var awardedBy = value.attributes['awardedBy'] + ", administered by ";
          var administeredBy = value.attributes['administeredBy'] + ", ";
          var startDate = value.attributes['startDate'].substr(0,4) + " - ";
          var endDate = value.attributes['endDate'].substr(0,4);
          results['grants'].push({'label':label, 'awardedBy': awardedBy, 'administeredBy': administeredBy,
                                  'startDate': startDate, 'endDate': endDate});
        });
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
        };
      });

      run_template(results);


      }).fail(function(xhr, textStatus, err) {
        console.log(textStatus);
      });
    };


    $(document).ready(function() {

      $("#create_file").click(function(e) {
        e.preventDefault();
        get_data();

      });
    });
