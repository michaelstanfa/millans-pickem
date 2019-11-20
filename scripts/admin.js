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
	this.team = team,
	this.against = against,
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

const getTeamCard = (team, gameIndex) => {
	return '<td class="team_option" index=' + gameIndex + ' abbr=' + team.Abbreviation + ' onclick=selectThisCard(this)>' + team.Name + TD_CLOSE;

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

async function loadMatchupsForLineSetting(week) {
	if(week != "select") {
		console.log(week);
		weekGames = schedule.fullgameschedule.gameentry.filter(e => e.week == week);
		let i = 0;
		weekGames.forEach(g => {
			games[i] = new Game(g.id, g.awayTeam, g.homeTeam, g.date, g.time, getLine(week, g.awayTeam), getLine(week, g.homeTeam));
			i++;
		})
		console.log(weekGames);
		thisWeek = new Week(week, games);
		populateWeeklyScheduleForLines(thisWeek);
	} else {
		$("#this_week_games_admin").html("");
	}
}

const changeThisLine = (gameId, idToChange, line, side) => {

	let game = thisWeek.games.filter(g => g.id == gameId);
	$("#" + idToChange).val(-line);

	if(side=='away') {
		game[0].awayLine = line / 1;
		game[0].homeLine = -line / 1;
	} else {
		game[0].awayLine = -line / 1;
		game[0].homeLine = line / 1;
	}

	console.log(game);

}

const populateWeeklyScheduleForLines = (thisWeek) => {

	let table = TABLE_OPEN;

	let data = "";

	thisWeek.games.forEach(g => {

		data += TR_OPEN + 
			getTeamCard(g.awayTeam, g.id) +
			TD_OPEN + "<input class = 'line' id='" + g.id + "_" + g.awayTeam.Abbreviation + "' oninput='changeThisLine(" + g.id + "," + "\"" + g.id + "_" + g.homeTeam.Abbreviation + "\"" + ", this.value, \"away\")' type='number' step='1' size='4' value='0.5'>" + TD_CLOSE +
			TD_OPEN + "@" + TD_CLOSE + 
			getTeamCard(g.homeTeam, g.id) +
			TD_OPEN + "<input class = 'line' id='" + g.id + "_" + g.homeTeam.Abbreviation + "' oninput='changeThisLine(" + g.id + "," + "\"" + g.id + "_" + g.awayTeam.Abbreviation + "\"" + ", this.value, \"home\")' type='number' step='1' size='4' value='-0.5'>" + TD_CLOSE +
			TD_OPEN + g.date + TD_CLOSE +
			TD_OPEN + g.time + TD_CLOSE +
		TR_CLOSE
	})

	table += data;
	table += TABLE_CLOSE;

	$("#this_week_games_admin").html(table);

}

const getLine = (week, team) => {
	return 1.5;
}

const prettyPrintTheLine = (line) => {
	if(line > 0) {
		return " +" + line;
	} else {
		return " -" + line;
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
					$("#select_week_dropdown_admin").val(result);	
					loadMatchupsForLineSetting(result);
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

const reviewLines = () => {

	lines = [ ...$(".line")];
	console.log(thisWeek);
	console.log(lines);
	linesMap = new Map(lines.map(l => [l.id, l.value]));
	console.log(linesMap);
	picks = choices.filter(c => c != "NONE");

	if(cardPicks.length != 3) {
		alert("Pick 3 and only 3 games.");
	} else {
		var options = {
			'show': true
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