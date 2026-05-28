git add .
git commit -m "Changed ERC1155 to server side AES encryption"
git push heroku master
heroku logs --source app --tail