import React, { Component, PropTypes } from 'react'

import { requestCV } from './actions'


export class ScholarsCVApp extends Component {

  constructor(props) {
    super(props)
    this.handleSubmitRequest = this.handleSubmitRequest.bind(this)
  }

  handleSubmitRequest(e) {
    e.preventDefault()
    const { dispatch } = this.props
 
    console.log("*****handleSubmitRequest*****")

    dispatch(requestCV())

  }

//     Response.AddHeader("Content-Disposition", "inline;filename=" + fileName);
//     return new FileStreamResult(WordStream(doc.DocumentBody), "application/msword");
 
  render() {
 
    return (

      <div>
        <h1>Scholars CV Generator</h1>

        <button onClick={this.handleSubmitRequest}>Try It!</button>
      
      </div>
    )
  }

}


import { connect } from 'react-redux'

const mapStateToProps = (cv) => {
  return { ...cv }
}

export default connect(mapStateToProps)(ScholarsCVApp)

