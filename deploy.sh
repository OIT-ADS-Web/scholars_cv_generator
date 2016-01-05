#!/usr/bin/env bash
set -o errexit

ENVIRONMENT=${1:-"acceptance"}
deploy_dir="/srv/web/apps/cv_generator"

case "$ENVIRONMENT" in
  #development)
  #  SERVERS=("scholars-web-dev-02.oit.duke.edu")
  #  ;;
  acceptance)
    SERVERS=("scholars-web-test-04.oit.duke.edu" "scholars-web-test-05.oit.duke.edu")
    ;;
  production)
   SERVERS=("scholars-web-04.oit.duke.edu" "scholars-web-05.oit.duke.edu")
   ;;
  *)
    echo "Usage: $0 {development|acceptance|production}"
    exit 1
esac


for SERVER in "${SERVERS[@]}"; do
  echo "deploying to $ENVIRONMENT server: $SERVER..."

  echo "creating deploy directory on $SERVER..."
  ssh tomcat@$SERVER "[ -d $deploy_dir ] || mkdir $deploy_dir"
 
  echo "rsyncing files to $SERVER..."
  rsync -avz cv_generator.html tomcat@$SERVER:$deploy_dir/cv_generator.html
 
  # NOTE: do NOT compress 
  echo "rsyncing files to $SERVER..."
  rsync -av cv_template.docx tomcat@$SERVER:$deploy_dir/cv_template.docx
  rsync -av cv_template_only_a.docx tomcat@$SERVER:$deploy_dir/cv_template_only_a.docx
  
  echo "creating js directory on $SERVER..."
  ssh tomcat@$SERVER "[ -d $deploy_dir/js ] || mkdir $deploy_dir/js"


  #echo "rsyncing asset files to $SERVER..."
  rsync -avz js/*.js tomcat@$SERVER:$deploy_dir/js/

done

