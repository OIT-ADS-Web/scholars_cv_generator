import React, { Component, PropTypes } from 'react'

import { setUri, setTemplate, requestCV } from './actions'

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
    console.log(parsed)
    
    if (parsed['uri']) {
      dispatch(setUri(parsed['uri']))
      console.log("hello")
      dispatch(setTemplate(parsed['template']))
       console.log("how are u")
      dispatch(requestCV(parsed['uri'],parsed['template']))
       console.log("getting")
    }
    // else?
    // error....
  }

  handleSubmitRequest(e) {
    console.log("In Submit ****** 1")
    e.preventDefault()
    console.log("In Submit ****** 2")
    const { dispatch, cv } = this.props
 
    console.log("*****handleSubmitRequest*****")
    let uri = cv['uri']
    let template = cv['template']
    dispatch(requestCV(uri,template))
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
    return (

        <div className="container"></div>
         )
 }

}


import { connect } from 'react-redux'

const mapStateToProps = (cv) => {
  return { ...cv }
}

export default connect(mapStateToProps)(ScholarsCVApp)

