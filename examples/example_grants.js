require('dotenv').config();
const widgetsUrl = process.env.WIDGETS_URL
console.log("WIDGETS_URL="+widgetsUrl)

import * as data from './per2712132_test.json'
import { WidgetsPubMedParser } from '../src/widgets_pub_med_parser'
//per2712132
//per8345372

let widgetsParser = new WidgetsPubMedParser()

let grants = widgetsParser.parseGrants(data)

console.log(grants)
