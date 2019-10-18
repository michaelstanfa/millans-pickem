let schedule = null;
let thisWeek = null;

var TABLE_OPEN = "<table class='table'>";
var TABLE_CLOSE = "</table>";
var TH_OPEN = "<th>";
var TH_CLOSE = "</th>"
var TR_OPEN = "<tr>";
var TR_CLOSE = "</tr>";
var TD_OPEN = "<td>";
var TD_CLOSE = "</td>";
var DIV_OPEN = "<div>";
var DIV_CLOSE = "</div>";

function Schedule(fullgameschedule) {
	this.fullgameschedule = fullgameschedule;
}

function Week(week, games) {
	this.week = week,
	this.games = games;
}

function Game(id, awayTeam, homeTeam, date, time, awayLine, homeLine) {
	this.id = id,
	this.awayTeam = awayTeam,
	this.homeTeam = homeTeam,
	this.date = date,
	this.time = time,
	this.awayLine = awayLine,
	this.homeLine = homeLine;
}

const getSchedule = async () => {
	return new Promise(function(resolve, reject){
		if(null == schedule) {
			resolve(retrieveSched());
		} else {
			resolve(schedule);
		}	
	})
}

async function retrieveSched() {

	return $.ajax
	({
		type: "GET",
		url: "https://api.mysportsfeeds.com/v1.2/pull/nfl/2019-regular/full_game_schedule.json",
		dataType: 'json',
		async: true,
		headers: {
	      "Authorization": "Basic " + btoa(creds.id + ":" + creds.secret)
	    },
	   	error: function(XMLHttpRequest, textStatus, errorThrown) {
	   		console.log("Failed to make call to endpoint");
	   		console.error("Status: " + textStatus);
	   		console.error("Error: " + errorThrown);
	   	}

	})

}

async function loadSpecificWeekMatchups(week) {

	if(week != "select") {
		let weekGames = schedule.fullgameschedule.gameentry.filter(e => e.week == week);
		let games = [];
		let i = 0;
		weekGames.forEach(g => {
			games[i] = new Game(g.id, g.awayTeam, g.homeTeam, g.date, g.time, getLine(week, g.awayTeam), getLine(week, g.homeTeam));
			i++;
		})
		thisWeek = new Week(week, games);

		populateWeeklySchedule(thisWeek);
	} else {
		$("#this_week_games").html("");
	}
}

const populateWeeklySchedule = (thisWeek) => {

	let table = TABLE_OPEN;
	
	let header = "<h3>Week " +thisWeek.week + "</h3>" +
				"<th>Away</th>" +
				"<th>Home</th>" +
				"<th>Day</th>" +
				"<th>Time</th>";


	let data = "";

	thisWeek.games.forEach(g => {
		console.log(g);
		data += TR_OPEN + 
			TD_OPEN + g.awayTeam.Name + g.awayLine + TD_CLOSE +
			TD_OPEN + "@" + TD_CLOSE + 
			TD_OPEN + g.homeTeam.Name + g.homeLine + TD_CLOSE + 
			TD_OPEN + g.date + TD_CLOSE +
			TD_OPEN + g.time + TD_CLOSE + 
			TD_OPEN + "|" + TD_CLOSE + 
			TD_OPEN + '<input class = "radio_choice" name = "' + g.id + '" value = ' + g.awayTeam.Abbreviation + ' type="radio"> ' + g.awayTeam.Abbreviation + TD_CLOSE +
			TD_OPEN + '<input class = "radio_choice" name = "' + g.id + '" value = ' + g.homeTeam.Abbreviation + ' type="radio"> ' + g.homeTeam.Abbreviation + TD_CLOSE +
			TD_OPEN + '<input class = "radio_choice" name = "' + g.id + '" value = "NONE" type="radio" checked> None' + TD_CLOSE +
		TR_CLOSE
	})

	table += data;
	table += TABLE_CLOSE;

	$("#this_week_games").html(table);

}

const getLine = (week, team) => {
	return " (+1.5)";
}

const loadData = async () => {

	console.log("loading data");

	let promiseSchedule = getSchedule();

	promiseSchedule.then(
		result => {
			schedule = result;

			let promise = new Promise(function(resolve, reject) {
			 	resolve(getGameWeek());
			});

			promise.then(
				result => {
					$("#select_week_dropdown").val(result);	
					console.log(result);
					loadSpecificWeekMatchups(result);
				},
				error => {
					console.log(error);
				})
		},
		error => {
			console.log(error);
		}
	)
}  

const submitPicks = () => {

	let choices = [ ...$(".radio_choice:checked")];
	
	console.log(choices);
	choices = choices.map(c => c.value);
	let picks = choices.filter(c => c != "NONE");

	if(picks.length != 3) {
		alert("You must choose three and only three games, idiot");
	} else {
		alert("Are you sure you want to make these picks?\n\n" + picks.join(", "));
	}

}