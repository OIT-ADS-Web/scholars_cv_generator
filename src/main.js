import React from 'react'

import { render, unmountComponentAtNode  } from 'react-dom'
import ScholarsCV from './ScholarsCV'
import 'jquery'
import 'babel-polyfill'

//require ('bootstrap')

//require('./styles/main.less');

module.exports = function(targetNode) {
  unmountComponentAtNode(targetNode)
  render (
      <ScholarsCV />,
      targetNode
  )
}


