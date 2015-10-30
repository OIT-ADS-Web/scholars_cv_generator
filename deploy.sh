#!/usr/bin/env bash
set -o errexit

ENVIRONMENT=${1:-"development"}
deploy_dir="/srv/web/apps/vivo_widgets_reporter/cv_generator"

case "$ENVIRONMENT" in
  development)
    SERVERS=("scholars-web-dev-02.oit.duke.edu")
    ;;
  acceptance)
    SERVERS=("scholars-web-test-04.oit.duke.edu" "scholars-web-test-05.oit.duke.edu")
    ;;
  #production)
  #  SERVERS=("scholars-web-04.oit.duke.edu" "scholars-web-05.oit.duke.edu")
  #  ;;
  #*)
    echo "Usage: $0 {development|acceptance|production}"
    exit 1
esac


for SERVER in "${SERVERS[@]}"; do
  echo "deploying to $ENVIRONMENT server: $SERVER..."

  echo "creating deploy directory on $SERVER..."
  ssh tomcat@$SERVER "[ -d $deploy_dir ] || mkdir $deploy_dir"
 
  echo "rsyncing files to $SERVER..."
  rsync -avz index.html tomcat@$SERVER:$deploy_dir/index.html

  echo "creating css directory on $SERVER..."
  ssh tomcat@$SERVER "[ -d $deploy_dir/css ] || mkdir $deploy_dir/css"
  
  echo "creating js directory on $SERVER..."
  ssh tomcat@$SERVER "[ -d $deploy_dir/js ] || mkdir $deploy_dir/js"


  #echo "rsyncing asset files to $SERVER..."
  rsync -avz css/*.css tomcat@$SERVER:$deploy_dir/css/
  rsync -avz js/*.js tomcat@$SERVER:$deploy_dir/js/

done

