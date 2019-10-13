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

function Game(awayTeam, homeTeam, date, time) {
	this.awayTeam = awayTeam,
	this.homeTeam = homeTeam,
	this.date = date,
	this.time = time;
}

async function getSchedule() {

	if(null == schedule) {
		schedule = retrieveSched();
	} else {
		return schedule;
	}
}

async function retrieveSched() {
	console.log("during");
	response = $.ajax
	({
		type: "GET",
		url: "https://api.mysportsfeeds.com/v1.2/pull/nfl/2019-regular/full_game_schedule.json",
		dataType: 'json',
		async: true,
		headers: {
	      "Authorization": "Basic " + btoa(creds.id + ":" + creds.secret)
	    },
	    success: function (){
	    	schedule = JSON.parse(response.responseText);
	    	console.log(schedule);
	    	return schedule;
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
			games[i] = new Game(g.awayTeam, g.homeTeam, g.date, g.time);
			i++;
		})
		thisWeek = new Week(week, games);

		populateWeeklySchedule(thisWeek);
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
		data += TR_OPEN + 
			TD_OPEN + g.awayTeam.Name + TD_CLOSE +
			TD_OPEN + "@" + TD_CLOSE + 
			TD_OPEN + g.homeTeam.Name + TD_CLOSE + 
			TD_OPEN + g.date + TD_CLOSE +
			TD_OPEN + g.time + TD_CLOSE + 
			TR_CLOSE
	})


	//table += header;
	table += data;
	table += TABLE_CLOSE;

	$("#this_week_games").html(table);

}

function loadData() {
	console.log("loading data");
	getSchedule();
	loadSpecificWeekMatchups("select");
}