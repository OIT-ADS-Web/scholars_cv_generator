// NOTE: to run > babel-node examples/example_publications.js 
// need .env file at root
require('dotenv').config();
const widgetsUrl = process.env.WIDGETS_URL
console.log("WIDGETS_URL="+widgetsUrl)

import * as data from './per2240072_test.json'
import { WidgetsParser } from '../src/widgets_parser'

let widgetsParser = new WidgetsParser()

let weblinks =  widgetsParser.parseWebpages(data)
let details = {...weblinks }
console.log(details)
