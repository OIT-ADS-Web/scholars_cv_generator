# Scholars@Duke CV Generator


## Getting Started

Install node dependencies:

    > npm install

## Start the development server:

  ```
  > npm run start
    
  ```

  or (if need to set an environment):

  ```
  > NODE_ENV=(development|acceptance_dev) npm start

  ```

This will watch all files, rebuild and hot-load the running dev server code with your changes. No need to refresh the browser.

Navigate to:  

  http://localhost:8334
  
To see a template working in the browser (no file download), point to a widgets URL:

  http://localhost:8334/?uri=https://scholars2-test.oit.duke.edu/individual/per8345372&template=medicine&format=html


## Building and Deploying

  First run the build command - this puts something in the `./dist` folder.  *NOTE*: you have to do `npm run build` not just `npm build`
  
  ```
  NODE_ENV=(acceptance|production) npm run build
  
  ```




