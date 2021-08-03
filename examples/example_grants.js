require('dotenv').config();
const widgetsUrl = process.env.WIDGETS_URL
console.log("WIDGETS_URL="+widgetsUrl)

import * as data1 from './per2712132_test.json'
import * as data2 from './per8709172_test.json'

import { WidgetsPubMedParser } from '../src/widgets_pub_med_parser'

let widgetsParser = new WidgetsPubMedParser()

let grants1 = widgetsParser.parseGrants(data1)
console.log(grants1)

let grants2 = widgetsParser.parseGrants(data2)
console.log(grants2)



