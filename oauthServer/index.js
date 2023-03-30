const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const express = require('express')
const app = express()
const mysql = require('./api/mysql')
const port = 3333
const path = require('path');
app.use(express.static('public'))
async function access_token_get(code){
    let options = {
        url: 'https://discord.com/api/oauth2/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'client_id': '1051526092311232584',
          'client_secret': 'rw0R0mRozpAbG7jeiwKQqygsnT8Ttse1',
          'grant_type': 'client_credentials',
          'code': code,
          'redirect_uri': 'http://localhost:3333/',
          'scope': 'identify email'
        })
      }
    let discord_data = await fetch('https://discord.com/api/oauth2/token', options).then((response) => {
        return response.json();
      }).then((response) => {
        return response;
      });
      console.log(discord_data)
}
async function getInfos(code, callback){
    let response2;
    let options = {
        url: 'https://discord.com/api/oauth2/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'client_id': '1051526092311232584',
          'client_secret': 'rw0R0mRozpAbG7jeiwKQqygsnT8Ttse1',
          'grant_type': 'client_credentials',
          'code': code,
          'redirect_uri': 'http://localhost:3333/',
          'scope': 'identify email'
        })
      }
    let discord_data = await fetch('https://discord.com/api/oauth2/token', options).then((response) => {
       
        return response.json();
      }).then((response) => {
        
        response2 = response
        return response
      });
    var site = await fetch("https://discord.com/api/users/@me", {
    method: 'GET',
    headers: {'Authorization': `Bearer ${discord_data.access_token}`}
});
var response = await site.json();
var username = response.username;
callback(response)
return response2
}




app.get('/oauth2', (req, res) => {
    getInfos(req.query.code, function(response, err){
        const u = new URLSearchParams(response).toString();
        console.log(u)
        console.log(response)
        res.send("<a href='indra://oauth2Login?" + u + "'>Logado com sucesso! Clique aqui para entrar em seu painel.</a>")
    })
    
})
app.get('/games', (req, res) => {
  mysql.getGames(function(response,err){
    res.send(response)
  })
  
})
app.get('/download', (req, res) => {
  const fileName = req.query.fileName
  console.log(fileName)
  res.sendFile( path.resolve('./' + fileName) );
  
})
app.get('/getUserLicenseByGameID', (req, res) => {
  const gameId = req.query.gameId
  const userId = req.query.userId
  console.log(gameId)
  console.log(userId)
  mysql.getUserLicenseByGameID(userId, gameId, function(response,err){
    res.send(response)
  })
  
})
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
