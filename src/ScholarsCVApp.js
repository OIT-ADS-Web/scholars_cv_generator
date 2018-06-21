import React, { Component, PropTypes } from 'react'

import { setUri, setTemplate, setFormat, requestCV } from './actions'

import queryString from 'query-string'

import sanitizeHtml from 'sanitize-html'

export class ScholarsCVApp extends Component {

  constructor(props) {
    super(props)
    this.handleSubmitRequest = this.handleSubmitRequest.bind(this)
  }

  // http://localhost:8334/?uri=https://scholars.duke.edu/individual/per4284062
  componentDidMount() {
    const { dispatch } = this.props
  
    const parsed = queryString.parse(location.search)
    
    if (parsed['uri']) {
      dispatch(setUri(parsed['uri']))
      
      dispatch(setTemplate(parsed['template']))

      dispatch(setFormat(parsed['format']))
       
      dispatch(requestCV(parsed['uri'],parsed['template'],parsed['format']))
    }
    // else?
    // error....
  }

  handleSubmitRequest(e) {
    e.preventDefault()
    
    const { dispatch, cv } = this.props
 
    let uri = cv['uri']
    let template = cv['template']
    let format = cv['format']
    dispatch(requestCV(uri,template,format))
  }
   
  
  // http://stackoverflow.com/questions/10026626/check-if-html-snippet-is-valid-with-javascript
  // need to remove 
  //  tags too
  tidy(html) {
    let clean = sanitizeHtml(html, {
      allowedTags: false,
      transformTags: {
        'html': 'div',
        'body': function(tagName, attribs) {
          return {
            tagName: 'div',
            attribs: {
              class: 'well'
            }
          }
        },
        'head': function(tagName, attribs) {
          return {
            tagName: 'div',
            attribs: false
          }
        },
        'title': function(tagName, attribs) {
          return {
            tagName: 'div',
            attribs: false,
            text: ''
          }
        },
        'style': function(tagName, attribs) {
          return {
            tagName: 'div',
            attribs: false,
            text: ''
          }
        }
      }
    })
    
   return clean

  }
  

  render() {        
         const { dispatch, cv } = this.props
         let template = cv['template']
         let format = cv['format']

         if(template != "" && template != undefined && format == "word"){
            return (
              <div className="container"></div>
            )
          }else { 
             const { cv : {html} } = this.props
             
             let htmlContent = (html) => {
              if (html) {
                // need to remove <html><body>
                let html_content = this.tidy(html)
                //console.log(html_content)
                return <div className="well" dangerouslySetInnerHTML={{__html: html_content}} />
              } else {
                return <div></div>
              }
             }
             let html_section = htmlContent(html)
             return (
                <div className="container">{html_section}</div>
             )
        }
  }
}


import { connect } from 'react-redux'

const mapStateToProps = (cv) => {
  return { ...cv }
}

export default connect(mapStateToProps)(ScholarsCVApp)

