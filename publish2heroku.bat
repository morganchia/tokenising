git add .
git commit -m "Updating changes to Heroku"
git push heroku master
heroku logs --source app --tail