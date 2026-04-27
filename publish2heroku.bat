git add .
git commit -m "Fixed issue with submitting and approving multiple contractors and payments"
git push heroku master
heroku logs --source app --tail