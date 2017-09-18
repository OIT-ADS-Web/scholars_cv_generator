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
  

## Building and Deploying

  First run the build command - this puts something in the `./dist` folder.  *NOTE*: you have to do `npm run build` not just `npm build`
  
  ```
  NODE_ENV=(acceptance|production) npm run build
  
  ```

## Duke specific Information

  Then there is a simple script that copies files.
  ```
  ./deploy_acceptance.sh
  
  ```

NOTE: this is only for acceptance and is accessible here:

https://scholars2-test.oit.duke.edu/scholars_search/scholars_cv_generator/


Eventually (in the future) there should be a *scholars_cv_deploy* project of some sort, like 
the *scholars_search_deploy* project (see gitlab).



