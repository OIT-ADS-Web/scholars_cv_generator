// NOTE: to run > babel-node examples/example_publications.js
// need .env file at root
require('dotenv').config();
const widgetsUrl = process.env.WIDGETS_URL
console.log("WIDGETS_URL="+widgetsUrl)

import * as data from './per8345372_test.json'
import { WidgetsPubMedParser } from '../src/widgets_pub_med_parser'

let widgetsParser = new WidgetsPubMedParser()

let publications = widgetsParser.parsePublications(data)
let keys = Object.keys(publications)
// can be -> 'journals', 'manuscripts', 'letters', 'editorials',
// 'abstracts', 'reviews', 'others', 'nonauthored', 'books',
// 'booksections'
let total = 0
for (var key of keys) {
    let obj = publications[key]
    if (Array.isArray(obj)) {
        console.log(`****${key}:${obj.length}*****`)
        total += obj.length 
        obj.forEach(publication => {
            console.log(publication)
        })
    } else {
       console.log(key + " empty object")
    }
}
console.log("total gathered =" + total)

