import React, { Component, PropTypes } from 'react'

import { requestCV } from './actions'


import queryString from 'query-string'


export class ScholarsCVApp extends Component {

  constructor(props) {
    super(props)
    this.handleSubmitRequest = this.handleSubmitRequest.bind(this)
  

  }

  componentDidMount() {
    //let query = location.query
    const { dispatch } = this.props
  
    //console.log(query)
    // initialze with request param?
    // maybe call an APP_INIT action ??
    const parsed = queryString.parse(location.search)
    console.log(parsed)
    
    //if (parsed['uri'])
    //dispatch(setURI(parsed['uri'])
    // else
    // error ....
     
  }

  handleSubmitRequest(e) {
    e.preventDefault()
    const { dispatch } = this.props
 
    console.log("*****handleSubmitRequest*****")

    dispatch(requestCV())

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

