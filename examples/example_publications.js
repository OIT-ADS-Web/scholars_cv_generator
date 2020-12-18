// NOTE: to run > babel-node examples/example_publications.js
// need .env file at root
require('dotenv').config();
const widgetsUrl = process.env.WIDGETS_URL
console.log("WIDGETS_URL="+widgetsUrl)

import * as data from './per8345372_test.json'
import { WidgetsPubMedParser } from '../src/widgets_pub_med_parser'

import * as expected from './expected.json'
let widgetsParser = new WidgetsPubMedParser()

let grouped = widgetsParser.parsePublications(data)
let keys = Object.keys(grouped)
// can be -> 'journals', 'manuscripts', 'letters', 'editorials',
// 'abstracts', 'reviews', 'others', 'nonauthored', 'books',
// 'booksections'
let total = 0
// for each group
for (var key of keys) {
    let obj = grouped[key]
    if (Array.isArray(obj)) {
        console.log(`****${key}:${obj.length}*****`)
        total += obj.length 
        obj.forEach(publication => {
            console.log(publication.uri)
            let expect = expected[publication.uri]
            if (key != expect) {
              console.log("*** found in " + key + " supposed to be in " + expect + ";subtypes:" + publication.subtypes)
            }
        })
    } else {
       console.log(key + " empty object")
    }
}
console.log("total gathered =" + total)

/*
let expected = {
 'https://scholars.duke.edu/individual/pub639513': 'editorials',
 'https://scholars.duke.edu/individual/pub641272': 'editorials',
 'https://scholars.duke.edu/individual/pub641381': 'editorials',
 'https://scholars.duke.edu/individual/pub640413': 'editorials',
 'https://scholars.duke.edu/individual/pub639460': 'editorials',
 'https://scholars.duke.edu/individual/pub641084': 'editorials',
 'https://scholars.duke.edu/individual/pub639512': 'editorials',
 'https://scholars.duke.edu/individual/pub638936': 'editorials',
 'https://scholars.duke.edu/individual/pub639731': 'editorials',
 'https://scholars.duke.edu/individual/pub639519': 'letters',
 'https://scholars.duke.edu/individual/pub641751': 'letters',
 'https://scholars.duke.edu/individual/pub641734': 'letters',
 'https://scholars.duke.edu/individual/pub645067': 'journal articles',
 'https://scholars.duke.edu/individual/pub665594': 'journal articles',
 'https://scholars.duke.edu/individual/pub645077': 'journal articles',
 'https://scholars.duke.edu/individual/pub665906': 'journal articles',
 'https://scholars.duke.edu/individual/pub666466': 'journal articles',
 'https://scholars.duke.edu/individual/pub673162': 'journal articles',
 'https://scholars.duke.edu/individual/pub648787': 'journal articles',
 'https://scholars.duke.edu/individual/pub638923': 'journal articles',
 'https://scholars.duke.edu/individual/pub638921': 'journal articles',
 'https://scholars.duke.edu/individual/pub648801': 'journal articles',
 'https://scholars.duke.edu/individual/pub638940': 'journal articles',
 'https://scholars.duke.edu/individual/pub1031472': 'journal articles',
 'https://scholars.duke.edu/individual/pub638922': 'journal articles',
 'https://scholars.duke.edu/individual/pub639883': 'journal articles',
 'https://scholars.duke.edu/individual/pub642794': 'reviews',
 'https://scholars.duke.edu/individual/pub1144275': 'reviews',
 'https://scholars.duke.edu/individual/pub665870': 'manuscripts',
 'https://scholars.duke.edu/individual/pub665854': 'manuscripts',
 'https://scholars.duke.edu/individual/pub747275': 'manuscripts',
 'https://scholars.duke.edu/individual/pub747792': 'manuscripts',
 'https://scholars.duke.edu/individual/pub782106': 'manuscripts',
 'https://scholars.duke.edu/individual/pub711921': 'manuscripts',
 'https://scholars.duke.edu/individual/pub671373': 'manuscripts',
 'https://scholars.duke.edu/individual/pub648382': 'manuscripts',
 'https://scholars.duke.edu/individual/pub672703': 'manuscripts',
 'https://scholars.duke.edu/individual/pub661877': 'manuscripts',
 'https://scholars.duke.edu/individual/pub672798': 'manuscripts',
 'https://scholars.duke.edu/individual/pub671357': 'manuscripts',
 'https://scholars.duke.edu/individual/pub672993': 'manuscripts',
 'https://scholars.duke.edu/individual/pub641331': 'manuscripts',
 'https://scholars.duke.edu/individual/pub709010': 'manuscripts',
 'https://scholars.duke.edu/individual/pub692679': 'manuscripts',
 'https://scholars.duke.edu/individual/pub692823': 'manuscripts',
 'https://scholars.duke.edu/individual/pub750018': 'manuscripts',
 'https://scholars.duke.edu/individual/pub782900': 'manuscripts',
 'https://scholars.duke.edu/individual/pub639479': 'manuscripts',
 'https://scholars.duke.edu/individual/pub639069': 'manuscripts',
 'https://scholars.duke.edu/individual/pub639537': 'manuscripts',
 'https://scholars.duke.edu/individual/pub642395': 'manuscripts',
 'https://scholars.duke.edu/individual/pub641720': 'manuscripts',
 'https://scholars.duke.edu/individual/pub639550': 'manuscripts',
 'https://scholars.duke.edu/individual/pub1121290': 'manuscripts',
 'https://scholars.duke.edu/individual/pub643533': 'manuscripts',
 'https://scholars.duke.edu/individual/pub641824': 'manuscripts',
 'https://scholars.duke.edu/individual/pub641717': 'manuscripts',
 'https://scholars.duke.edu/individual/pub1127493': 'manuscripts',
 'https://scholars.duke.edu/individual/pub1042434': 'manuscripts',
 'https://scholars.duke.edu/individual/pub1371948': 'manuscripts',
 'https://scholars.duke.edu/individual/pub639523': 'manuscripts',
 'https://scholars.duke.edu/individual/pub858697': 'manuscripts'
}
*/
