let schedule = null;
let thisWeek = null;
let picks = null;
let choices = null;
let weekGames = null;
let games = [];
let submittingPicks = {};

var TABLE_OPEN = "<table class='table' style = 'overflow-x:auto' display: block>";
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

const getWeekOfGames = async (week) => {
	let sched = await getSchedule();
	return sched.fullgameschedule.gameentry.filter(e => e.week == week);
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
	return getTeamCardUsingString(team.Abbreviation, (team.Abbreviation != "WAS" ? team.Name : team.City), line, true)

	// return '<td class="team_option" abbr=' + team.Abbreviation + ' onclick=selectThisCard(this)>' + (team.Abbreviation != "WAS" ? team.Name : team.City) + prettyPrintTheLine(line) + TD_CLOSE;

}

const getTeamCardForAdmin = (abbreviation, display) => {
	return '<td class="team_option" abbr=' + abbreviation + '>' + display + TD_CLOSE;
}


const getTeamCardUsingString = (abbreviation, display, line, clickable) => {
	if(clickable) {
		return '<td class="team_option" abbr=' + abbreviation + ' onclick=selectThisCard(this)>' + display + prettyPrintTheLine(line) + TD_CLOSE;
	}
	return '<td class="team_option" abbr=' + abbreviation + '>' + display + prettyPrintTheLine(line) + TD_CLOSE;

}

async function retrieveSched() {
	year = "2020";
	return $.ajax
	({
		type: "GET",
		url: "https://api.mysportsfeeds.com/v1.2/pull/nfl/"+ year+ "-regular/full_game_schedule.json",
		dataType: 'json',
		async: true,
		headers: {
	      "Authorization": "Basic " + btoa(creds.id + ":" + creds.secret),
	      "Access-Control-Allow-Origin" : "*"
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
		console.log(weekGames);
		result = await loadWeekGames(weekGames);

		thisWeek = new Week(week, result);

		await populateWeeklySchedule(thisWeek);

	} else {

		$("#this_week_games").html("");
	}

	invalidateSubmitButton(week);

}

const loadPicksIfSelected = async (week) => {

	sleep(1000);

	let currentUser = await firebase.auth().currentUser;
	// console.log(currentUser);
	let gameWeek = $("#select_week_dropdown").val();
	console.log(gameWeek);
	let fs = firebase.firestore();	
	let usersCollection = await fs.collection('users');

	if(null == currentUser) {
		sleep(250);
		let currentUser = await firebase.auth().currentUser;
	}

	if(undefined != gameWeek) {
		await usersCollection.doc(currentUser.uid).collection('seasons').doc('202021').collection('weeks').doc(gameWeek).get().then(
			
		async function(doc) {

			let picks = await doc.data();
			if(null == picks) {
				$("#current_user_picks").html("You haven't made your picks yet.");
			} else {

				let label = TD_OPEN + "Current Picks: " + TD_CLOSE;
				let first_pick = getTeamCardUsingString(picks.pick_1.team, picks.pick_1.team, picks.pick_1.line, false);
				let second_pick = getTeamCardUsingString(picks.pick_2.team, picks.pick_2.team, picks.pick_2.line, false);
				let third_pick = getTeamCardUsingString(picks.pick_3.team, picks.pick_3.team, picks.pick_3.line, false);

				let alreadyPickedHTML = 
						TABLE_OPEN +
						TR_OPEN +
						label +
						first_pick +
						second_pick +
						third_pick +
						TR_CLOSE +
						TABLE_CLOSE;

				$("#current_user_picks").html(alreadyPickedHTML);
			}
		}
	);
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

const populateWeeklySchedule = (thisWeek) => {

	let table = TABLE_OPEN;
	
	let header = //"<h3>Week " +thisWeek.week + "</h3>" +
				"<th>Away</th>" +
				"<th></th>" +
				"<th>Home</th>" +
				"<th>Day</th>" +
				"<th>Time</th>";

	let data = new Promise(async function(resolve, reject) {
		resolve(await getGuts(thisWeek));
	});

	data.then(
		result => {
			table += header += result + TABLE_CLOSE;
			$("#this_week_games").html(table);
		});

}

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

const getGuts = async (thisWeek) => {

	await sleep(750);
	let guts = "";

	await thisWeek.games.forEach(g => {

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

const getScore = async (week, id, homeOrAway) => {

	let lines = await getThisWeekLines(week);

	try {
		if(!lines.game[id].home_team.score){
			return Promise.resolve(0);
		}
		if(homeOrAway == "home_team") {

			return Promise.resolve(lines.game[id].home_team.score);

		} else if (homeOrAway == "away_team") {

			return Promise.resolve(lines.game[id].away_team.score);

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
				async result => {
					console.log(result);
					await $("#select_week_dropdown").val(result);
					await $("#select_week_dropdown_admin").val(result);	
					await loadSpecificWeekMatchups(result);
					await loadMatchupsForLineSetting(result);
					await loadMatchupsForScoreSetting(result);
					await loadPicksIfSelected(result);
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

const invalidateSubmitButton = (selectedWeek) => {
	if(selectedWeek != getGameWeek() && togglz.disableOtherWeekSubmissions) {
		$("#submit-button").attr("disabled", true);
	} else {
		$("#submit-button").attr("disabled", false);
	}
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

	let selectedWeek = $("#select_week_dropdown").val();

	if(selectedWeek != getGameWeek() && togglz.disableOtherWeekSubmissions) {
		alert("Failed to submit. Wrong week.");
	}

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

const submitApprovedPicks = async () => {
	let currentUser = firebase.auth().currentUser;

	let fs = firebase.firestore();	
	let usersCollection = fs.collection('users');

	userExists = await usersCollection.doc(firebase.auth().currentUser.uid).get().then(
		function(doc) {
			if(doc.exists) {
				console.log("user exists");
				return true;
			} else {
				console.log("user doesn't exist");
				return false;
			}
		})

	if(!userExists) {
		alert("Weird... we don't see you in our system. Contact Ryan Millan or Michael Stanfa NOW. And maybe email your picks to Millan. We'll get this figured out, pal.");
	} else {

		let thisYear = '202021'

		let gameWeek = await getGameWeek();

		if(!togglz.disableOtherWeekSubmissions){
			gameWeek = $("#select_week_dropdown").val();	
		} 



		let firstPick =Object.entries(submittingPicks)[0][1]; 
		let secondPick =Object.entries(submittingPicks)[1][1]; 
		let thirdPick =Object.entries(submittingPicks)[2][1]; 

		let pick_1 = {
			'team': firstPick.team,
			'against': firstPick.against,
			'line': firstPick.line,
			'dateTime':null,
			'gameId': null
		}

		let pick_2 = {
			'team': secondPick.team,
			'against': secondPick.against,
			'line': secondPick.line,
			'dateTime':null,
			'gameId': null
		}

		let pick_3 = {
			'team': thirdPick.team,
			'against': thirdPick.against,
			'line': thirdPick.line,
			'dateTime':null,
			'gameId': null
		}

		await usersCollection.doc(currentUser.uid).collection('seasons').doc(thisYear).collection('weeks').doc(gameWeek).set(
			{
				pick_1: pick_1,
				pick_2: pick_2,
				pick_3: pick_3
			}
		);

		loadPicksIfSelected(gameWeek);

	}

}