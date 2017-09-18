import React, { Component } from 'react'

class ErrorHappened extends Component {

  constructor(props) {
    super(props)
  }

  render() {
    const { message } = this.props

    return (
        <div className="alert alert-warning search-results-info">
          {message}
        </div>
    )
  }


}


export default ErrorHappened

