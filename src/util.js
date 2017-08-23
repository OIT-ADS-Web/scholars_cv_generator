// https://github.com/open-xml-templating/docxtemplater/issues/203
var expressions = require('angular-expressions')

var angularParser = function(tag) {
  //console.log("parser ${tag}")

  return { 
    get: tag === '.' ? function(s){ return s;} : expressions.compile(tag.replace(/’/g, "'"))
  }
}


/**
 * Generate styled XML block, takes style name and paragraph content as params
 */
function styledParagraph(para_style, content_with_breaks){
  return `<w:p w:rsidR="0062642C" w:rsidRDefault="0062642C" w:rsidP="00612F43"><w:pPr><w:pStyle w:val="${para_style}"/></w:pPr><w:r w:rsidRPr="00612F43"><w:t>${content_with_breaks}</w:t></w:r></w:p>`;
}

/**
 * Create a filter based on style name from within template
 */
function styleFilter(style_name) {
  return function(text){
    if(text){
      text = escape_xml(text)
      let with_breaks =  text.split('\n').join('<w:br/>');
      return styledParagraph(style_name, with_breaks)
    } else {
      return "<w:p></w:p>" // return empty paragraph if there is no text
    }
  }
}

/**
 *  escape xml
 */
function escape_xml(text){
  return text.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/'/g, '&apos;');
}

/*

Kicker is having to define the appropriate styles in your template document.

Within template can use these filters to apply different styles to table cell content:

{@some_string|styleOne}

{@some_other_string|styleTwo}

{@third_string|styleThree}
*/

/*
expressions= require('angular-expressions');
    function(s){
      return s;} : expressions.compile(tag) };
    }
  
  new DocxGen(data).setOptions({parser:angularParser})
*/

/**
 *  escape xml
 */
function escape_xml(text){
  return text.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/'/g, '&apos;');
}

/**
 *  Set custom angular expressions
 */
expressions.filters.styleOne = styleFilter("StyleOne")
expressions.filters.styleTwo = styleFilter("StyleTwo")
expressions.filters.styleThree = styleFilter("StyleThree")


expressions.filters.upper = function(input) {
    // This condition should be used to make sure that if your input is undefined, your output will be undefined as well and will not throw an error
    if(!input) return input;
    return input.toUpperCase();
}


export default {
  angularParser
} 

