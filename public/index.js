"use strict"
let _ = require("lodash")
let husl = require('husl')
let request = require("browser-request")

let acDiv = document.getElementById("ActorCards")
let spDiv = document.getElementById("spoilers")

let spinner = document.getElementById("loading")
let smallspinner = document.getElementById("loadingSecondary")
smallspinner.style.visibility = "hidden"
let moviesearch = document.getElementById("movie")
let go = document.getElementById("go")
let optionsdiv = document.getElementById("options")
let titleEl = document.getElementById("title")
let prompt = document.getElementById("namePrompt")

let game
let correct = 0

function getMovies(query) {
  console.log(query)
  smallspinner.style.visibility = "visible"
  request("/api/queryMovie/" + query, (err, res, bod) => {
    if (err) throw err
    bod = JSON.parse(bod)
    buildMovieOptions(bod)
    smallspinner.style.visibility = "hidden"

  })
}

function getActors(id) {
  console.log(id)
  document.location.hash = id
  request("/api/getActors/" + id, (err, res, bod) => {
    if (err) throw err
    bod = JSON.parse(bod)
    spDiv.className = ""
    spinner.style.display = "none"
    smallspinner.style.visibility = "hidden"
    actorCards(bod.members)
    titleEl.innerHTML = bod.title
    game = setGame(bod.members)
  })
}

function setGame(members) {
  if (members.length < 1)
    return
  members = _.shuffle(members)
  console.log(members)
  setPrompt("Click: " + members[0].name)
  return (guess) => {
    if (guess === members[0].name) {
      correct++
      console.log("correct")
    }
    if (members.length === 1) {
      setPrompt("your score is: " + correct + '/5')
      spDiv.className = "reveal"
      correct = 0

    }
    game = setGame(members.slice(1))
    return guess === members[0].name
  }
}

function actorCards(actors) {
  let pageCards = _.map(actors, buildActorCard)
  acDiv.innerHTML = ""
  pageCards.forEach(card => acDiv.appendChild(card))
  let spoilers = _.map(actors, buildSpoiler)
  spDiv.innerHTML = ""
  spoilers.forEach(spoiler => spDiv.appendChild(spoiler))
}

function buildSpoiler(actor) {
  let sp = document.createElement("div");
  sp.className = "spoilerCard";
  let h = document.createElement("h5");
  h.textContent = actor.name
  h.className = "secret"
  sp.appendChild(h);
  return sp
}

const buildActorCard = actor => {
  let card = document.createElement("div");
  card.className = "imageCard";
  let img = document.createElement("img");
  img.className = "actorImage u-max-full-width";
  img.setAttribute("src", actor.imgurl);
  card.appendChild(img);
  card.addEventListener("click", (e) => {
    img.className = game(actor.name) ? "actorImage u-max-full-width green" : "actorImage u-max-full-width red"
  })
  return card
}

const buildMovieOptions = options => {
  let optionList = document.createElement("ul");
  options.forEach(movie => {
    let el = document.createElement("li");
    let label = document.createTextNode(movie.title);
    el.addEventListener("click", (e) => {
      e.target.className = "clicked"
      smallspinner.style.visibility = "visible"
      getActors(movie.id)
      optionsdiv.replaceChild(document.createElement("div"), optionsdiv.childNodes[0]);
    })
    el.appendChild(label);
    optionList.appendChild(el)
  })
  let el = document.createElement("li");
  let label = document.createTextNode("✖ close ✖");
  el.appendChild(label);
  el.addEventListener("click", (e) => {
    optionsdiv.replaceChild(document.createElement("div"), optionsdiv.childNodes[0]);
  })
  optionList.appendChild(el)
  optionsdiv.replaceChild(optionList, optionsdiv.childNodes[0])
}

function setPrompt(text) {
  prompt.textContent = text
}

go.addEventListener("click", () => getMovies(moviesearch.value))
if (window.location.hash)
  getActors(window.location.hash.slice(1))
else
  getActors("0120737")
