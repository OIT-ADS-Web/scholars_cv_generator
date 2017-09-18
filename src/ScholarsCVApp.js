import React, { Component, PropTypes } from 'react'

import { setUri, requestCV } from './actions'

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
    }
    // else?
    // error....
  }

  handleSubmitRequest(e) {
    e.preventDefault()
    const { dispatch, cv } = this.props
 
    console.log("*****handleSubmitRequest*****")
    let uri = cv['uri']

    dispatch(requestCV(uri))
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
 
    const { cv : {html} } = this.props
    //console.log(html)
    let htmlContent = (html) => {
      if (html) {
        // need to remove <html><body>
        let html_content = this.tidy(html)
        console.log(html_content)
        return <div className="well" dangerouslySetInnerHTML={{__html: html_content}} />
      } else {
        return <div></div>
     }
   }

    let html_section = htmlContent(html)

    return (

        <div className="container">
          <h1>Scholars CV Generator</h1>
            <div className="row bottom">
              <div className="col-md-12">
              <button className="btn btn-success btn-lg" 
                onClick={this.handleSubmitRequest}>Generate CV!
              </button>
              </div>
            </div>
          {html_section}
        </div>

    )
  }

}


import { connect } from 'react-redux'

const mapStateToProps = (cv) => {
  return { ...cv }
}

export default connect(mapStateToProps)(ScholarsCVApp)

