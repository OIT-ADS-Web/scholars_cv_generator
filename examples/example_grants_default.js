require('dotenv').config();
const widgetsUrl = process.env.WIDGETS_URL
console.log("WIDGETS_URL="+widgetsUrl)

import * as data1 from './per2712132_test.json'
import * as data2 from './per0482202_test.json'

import { WidgetsParser } from '../src/widgets_parser'

let widgetsParser = new WidgetsParser()

let grants1 = widgetsParser.parseGrantsAndGifts(data1)
console.log(grants1)

let grants2 = widgetsParser.parseGrantsAndGifts(data2)
console.log(grants2)


