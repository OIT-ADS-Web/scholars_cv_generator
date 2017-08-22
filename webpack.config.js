// the html plugin will dynamically add the bundle script tags to the main index.html file
// it also allows us to use template to build the rest of that file
var HtmlWebpackPlugin = require('html-webpack-plugin')
var webpack = require('webpack')

// FIXME: how to vary this per build ... 
//require('dotenv').config({path: '/custom/path/to/your/env/vars'});
var environment = process.env.NODE_ENV || 'development'
console.log(environment)
// FIXME: how to vary this per build ... 
//require('dotenv').config({path: '/custom/path/to/your/env/vars'});
var config = require('dotenv').config({path: __dirname + '/.env.'+ environment})

// FIXME: should we define a BASE_URL, so we can link correctly on acceptance
//
// can do this too:
// node -r dotenv/config your_script.js dotenv_config_path=/custom/path/to/your/env/vars
// (see) https://www.npmjs.com/package/dotenv#preload
//
module.exports = {
  // start an main.js and follow requires to build the 'app' bundle in the 'dist' directory
  entry: {
    app: ['babel-polyfill', "./src/main.js"]
  },
  // put all built files in dist
  // use 'name' variable to make 
  // bundles named after the entryoints
  // above
  output: {
    path: __dirname + "/dist/",
    filename: "[name].js",
    library: "ScholarsCV",
    libraryTarget: "umd"
  },
  // NOTE: this is in here so nock can run tests - but they don't work anyway
  //node: {
  // fs: "empty"
  //},
  module: {
    loaders: [
      { test: /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/, loader: 'file-loader' },
      // style pre-processing
      { test: /\.less$/, loader: 'style-loader!css-loader!less-loader' }, // use ! to chain loaders
      { test: /\.css$/, loader: 'style-loader!css-loader' },
      { test: /\.(png|gif|jpg)$/, loader: 'file-loader' },
      { test: /\.docx$/, loader: 'file-loader' },
      { test: /jquery/, loader: 'expose-loader?$!expose-loader?jQuery' },
      { test: /\.json$/, loader: 'json' },
       // react/jsx and es6/2015 transpiling
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        // http://asdfsafds.blogspot.com/2016/02/referenceerror-regeneratorruntime-is.html
        // http://stackoverflow.com/questions/33527653/babel-6-regeneratorruntime-is-not-defined-with-async-await
        query: {
          presets: ['react','es2015'],
          plugins: ["transform-runtime"]
        }
      }
    ]
  },
  // make sourcemaps in separate files
  devtool: 'source-map',
  plugins: [
    // build index from template, add cach-busting hashes to js bundle urls
    // pass title variable to the template - you can specify any property here
    // and access it in the src/index.ejs template
    //  inject: 'head',
    //  hash: true,
    //  title: "Calendar Demo",
    //  template: 'src/index.ejs/'
 
    new HtmlWebpackPlugin({
      inject: 'head',
      hash: true,
      title: "Scholars CV",
      template: 'src/index.ejs/'
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(environment),
      'process.env.WIDGETS_URL': JSON.stringify(process.env.WIDGETS_URL),
    })
  ]
}
