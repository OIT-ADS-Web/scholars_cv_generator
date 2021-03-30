// NOTE: to run > babel-node examples/example_publications.js 
// need .env file at root
require('dotenv').config();
const widgetsUrl = process.env.WIDGETS_URL
console.log("WIDGETS_URL="+widgetsUrl)

import * as data from './per8345372_test.json'
import { WidgetsPubMedParser } from '../src/widgets_pub_med_parser'

let widgetsParser = new WidgetsPubMedParser()

let name = widgetsParser.parseName(data)
let phone = widgetsParser.parsePhone(data)
let email = widgetsParser.parseEmail(data)
let title = widgetsParser.parseTitle(data)

let details = {...name, ...phone, ...email, ...title }
console.log(details)
