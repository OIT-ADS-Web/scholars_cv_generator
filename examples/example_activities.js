// NOTE: to run > babel-node examples/example_publications.js 
// need .env file at root
require('dotenv').config();
const widgetsUrl = process.env.WIDGETS_URL
console.log("WIDGETS_URL="+widgetsUrl)

import * as data from './per0482202_test.json'
import { WidgetsParser } from '../src/widgets_parser'

let widgetsParser = new WidgetsParser()

let prof = widgetsParser.parseProfessionalActivities(data)
let teaching = widgetsParser.parseTeachingActivities(data)
let details = {...prof, ...teaching }
console.log(details)
