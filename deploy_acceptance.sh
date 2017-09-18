et -o errexit

ENVIRONMENT=${1:-"acceptance"}
deploy_dir="/srv/web/apps/scholars_search/shared/cv_generator"

case "$ENVIRONMENT" in
  acceptance)
    SERVERS=("scholars-web-test-04.oit.duke.edu" "scholars-web-test-05.oit.duke.edu")
    ;;
  *)
    echo "Usage: $0 {acceptance}"
    exit 1
esac


for SERVER in "${SERVERS[@]}"; do
  echo "deploying to $ENVIRONMENT server: $SERVER..."

  echo "creating deploy directory on $SERVER..."
  ssh tomcat@$SERVER "[ -d $deploy_dir ] || mkdir $deploy_dir"
 
  echo "rsyncing app.js to $SERVER..."
  rsync -avz dist/app.js tomcat@$SERVER:$deploy_dir/app.js
 
  echo "rsyncing index.html to $SERVER..."
  rsync -av dist/index.html tomcat@$SERVER:$deploy_dir/index.html
   
  echo "rsyncing index.html to $SERVER..."
  rsync -av dist/app.js.map tomcat@$SERVER:$deploy_dir/app.js.map

  echo "rsyncing image and font files to $SERVER..."
  rsync -av dist/*.{woff,woff2,eot,ttf,svg,docx} tomcat@$SERVER:$deploy_dir/



done

