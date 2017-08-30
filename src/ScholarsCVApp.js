import React, { Component, PropTypes } from 'react'

import { setUri, requestCV } from './actions'


import queryString from 'query-string'


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

    //console.log(cv['uri'])
    // send in URI? here?
    dispatch(requestCV(uri))

  }


  render() {
 
    return (

      <div className="jumbotron">
        <div className="container">
          <h1>Scholars CV Generator</h1>
          <button className="btn btn-success btn-lg" onClick={this.handleSubmitRequest}>Generate CV!</button>
        </div>
      </div>

    )
  }

}


import { connect } from 'react-redux'

const mapStateToProps = (cv) => {
  return { ...cv }
}

export default connect(mapStateToProps)(ScholarsCVApp)

