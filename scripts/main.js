let schedule = null;
let thisWeek = null;
let picks = null;
let choices = null;
let weekGames = null;
let games = [];
let submittingPicks = {};

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

function Pick(team, against, line) {
	this.team = team;
	this.against = against;
	this.line = line;
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

const selectThisCard = (card) => {

	if(card.hasAttribute("selected")) {

		card.removeAttribute("selected");
		card.setAttribute("bgcolor", "");
	} else {

		card.setAttribute("selected", "");
		card.setAttribute("bgcolor", "#C0C0C0");
	}
}

const getTeamCard = (team, line) => {
	return '<td class="team_option" abbr=' + team.Abbreviation + ' onclick=selectThisCard(this)>' + team.Name + prettyPrintTheLine(line) + TD_CLOSE;

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

const loadSpecificWeekMatchups = async (week) => {

	if(week != "select") {
		let result = "";
		weekGames = schedule.fullgameschedule.gameentry.filter(e => e.week == week);

		result = await loadWeekGames(weekGames);

		thisWeek = new Week(week, result);

		await populateWeeklySchedule(thisWeek);

	} else {

		$("#this_week_games").html("");
	}
}

const loadWeekGames = async (weekGames) => {

	games = [];
	return new Promise(function(resolve, reject) {
		i = 0;
		weekGames.forEach(async (g) => {

			let awayLine = await getLine(g.week, g.id, "away_team");
			let homeLine = await getLine(g.week, g.id, "home_team");

			games[i] = new Game(g.id, g.awayTeam, g.homeTeam, g.date, g.time, awayLine, homeLine);

			i++;
		});
		resolve(games);
	});
}

const populateWeeklySchedule = async (thisWeek) => {

	let table = TABLE_OPEN;
	
	let header = "<h3>Week " +thisWeek.week + "</h3>" +
				"<th>Away</th>" +
				"<th>Home</th>" +
				"<th>Day</th>" +
				"<th>Time</th>";

	let data = new Promise(function(resolve, reject) {
		resolve(getGuts(thisWeek));
	});

	data.then(
		result => {
			table += result + TABLE_CLOSE;
			$("#this_week_games").html(table);
		});

}

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

const getGuts = async (thisWeek) => {

	await sleep(500);
	let guts = "";
	thisWeek.games.forEach(g => {

		guts += TR_OPEN + 
			getTeamCard(g.awayTeam, g.awayLine) +
			TD_OPEN + "@" + TD_CLOSE + 
			getTeamCard(g.homeTeam, g.homeLine) +
			TD_OPEN + g.date + TD_CLOSE +
			TD_OPEN + g.time + TD_CLOSE +
		TR_CLOSE;
	});

	return guts;
}

const getLine = async (week, id, homeOrAway) => {

	let lines = await getThisWeekLines(week);

	try {
		if(!lines.game[id].home_team.line){
			return Promise.resolve(0);
		}
		if(homeOrAway == "home_team") {

			return Promise.resolve(lines.game[id].home_team.line);

		} else if (homeOrAway == "away_team") {

			return Promise.resolve(lines.game[id].away_team.line);

		} else {
			return new Promise(function(resolve, reject) {
				resolve(0);
			});
		}
	} catch {
		return Promise.resolve(0);
	}	
}


const prettyPrintTheLine = (line) => {
	if(line > 0) {
		return " +" + line;
	} else if (line < 0 ) {
		return " " + line;
	} else {
		return " [--]"
	}
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

const getPickInfoFromAbbr = (abbr) => {

	let val = null;
	let game = games.filter(g => g.homeTeam.Abbreviation == abbr || g.awayTeam.Abbreviation == abbr); 
	if(game[0].homeTeam.Abbreviation == abbr) {
		return new Pick(game[0].homeTeam.Abbreviation, game[0].awayTeam.Abbreviation, game[0].homeLine);
	} else {
		return new Pick(game[0].awayTeam.Abbreviation, game[0].homeTeam.Abbreviation, game[0].awayLine);
	}
}

const validatePicks = () => {

	cardChoices = [ ...$(".team_option")];

	cardPicks = cardChoices.filter(c => c.hasAttribute("selected"));

	choices = cardPicks.map(c => c.abbr);

	picks = choices.filter(c => c != "NONE");

	if(cardPicks.length != 3) {
		alert("Pick 3 and only 3 games.");
	} else {
		var options = {
			'show':true
		};
		submittingPicks = [];
		picks.forEach(p => {
			submittingPicks[p] = getPickInfoFromAbbr(p);
		})

		let display = [];
		for (let [k, v] of Object.entries(submittingPicks)) {
			display.push(v.team + " " + prettyPrintTheLine(v.line) + " against " + v.against);
		}

		$("#modal-picks").html(display.join("<br />"));
		$("#submit-modal").modal(options);
	}

}