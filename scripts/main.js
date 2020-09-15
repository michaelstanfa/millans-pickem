let fs;

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

const getFirestore = async () => {
	if(!fs){
		fs = firebase.firestore();	
	}
	return fs;
}

function Schedule(fullgameschedule) {
	this.fullgameschedule = fullgameschedule;
}

function Week(week, games) {
	this.week = week,
	this.games = games;
}

function Game(id, awayTeam, homeTeam, date, time, awayLine, homeLine, awayScore, homeScore, final, week) {
	this.id = id,
	this.awayTeam = awayTeam,
	this.homeTeam = homeTeam,
	this.date = date,
	this.time = time,
	this.awayLine = awayLine,
	this.homeLine = homeLine,
	this.awayScore = awayScore,
	this.homeScore = homeScore,
	this.final = final,
	this.week = week;
}

function Pick(team, against, line, id, date, time, week) {
	this.team = team,
	this.against = against,
	this.line = line,
	this.id = id,
	this.date = date,
	this.time = time,
	this.week = week;
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
		card.setAttribute("bgcolor", "#90EE90");//#C0C0C0
	}
}

const getTeamCard = (team, line, locked) => {

	return getTeamCardUsingString(team.Abbreviation, (team.Abbreviation != "WAS" ? team.Name : team.City), line, !locked)

}

const getTeamCardForAdmin = (abbreviation, display) => {
	return '<td class="team_option" abbr=' + abbreviation + '>' + display + TD_CLOSE;
}


const getTeamCardUsingString = (abbreviation, display, line, clickable) => {
	if(clickable) {
		return '<td class="team_option" abbr=' + abbreviation + ' onclick=selectThisCard(this)>' + display + prettyPrintTheLine(line) + TD_CLOSE;
	}
	return '<td class="team_option" abbr=' + abbreviation + '>' + (display === 'LA' ? 'LAR' : display) + prettyPrintTheLine(line) + TD_CLOSE;

}

const getTeamCardForCurrentPicks = (abbreviation, display, line, locked) => {
	let bgcolor = "#FFFFFF";
	if(locked) {
		bgcolor = "#C0C0C0";
	}

	return '<td bgcolor="' + bgcolor + '" class="team_option" abbr=' + abbreviation + '>' + (display === 'LA' ? 'LAR' : display) + prettyPrintTheLine(line) + TD_CLOSE;	
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

		result = await loadWeekGames(weekGames, week);
		thisWeek = new Week(week, result);

		await populateWeeklySchedule(result);

	} else {

		$("#this_week_games").html("");
	}

	invalidateSubmitButton(week);

}

const loadPicksIfSelected = async (week) => {

	sleep(1000);

	let gameWeek = $("#select_week_dropdown").val();

	let fs = firebase.firestore();
	let usersCollection = await fs.collection('users');

	let currentUser = await firebase.auth().currentUser;

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

				let p1 = await picks.pick_1;
				let p2 = await picks.pick_2;
				let p3 = await picks.pick_3;

				let first_pick = getTeamCardForCurrentPicks(p1.team, p1.team, p1.line, isGameLocked(p1.date, p1.time));
				let second_pick = getTeamCardForCurrentPicks(p2.team, p2.team, p2.line, isGameLocked(p2.date, p2.time));
				let third_pick = getTeamCardForCurrentPicks(p3.team, p3.team, p3.line, isGameLocked(p3.date, p3.time));

				let alreadyPickedHTML = "";

				alreadyPickedHTML = 
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
		});
	}
}

	
const fetchPicksIfSelected = async (week) => {
	let currentUser = await firebase.auth().currentUser;

	if(null === currentUser) {
		sleep(250);
		let currentUser = await firebase.auth().currentUser;
	}

	return fetchUserPicksWithIdAndWeek(week, currentUser.uid);
}

const fetchUserPicksWithIdAndWeek = async (week, userId) => {
	week = week.toString()
	sleep(1000);

	let fs = firebase.firestore();	
	let usersCollection = await fs.collection('users');

	if(undefined != week) {
		return await usersCollection.doc(userId).collection('seasons').doc('202021').collection('weeks').doc(week).get().then(
			
		async function(doc) {

			let picks = await doc.data();
			if(null != picks) {
				return picks;
			}
		})
	}
}

const fetchUserWinsWithId = async (userId) => {
	let fs = firebase.firestore();	
	let usersCollection = await fs.collection('users');

	return await usersCollection.doc(userId).collection('seasons').doc('202021').get().then(

		async function(doc) {
			return doc.data().wins;
		}
	);

}


const fetchUserLossesWithId = async (userId) => {
	let fs = firebase.firestore();	
	let usersCollection = await fs.collection('users');

	return await usersCollection.doc(userId).collection('seasons').doc('202021').get().then(function(doc) {
		return doc.data().losses;
	});

}

const loadWeekGames = async (weekGames, week) => {

	games = [];
	return new Promise(function(resolve, reject) {
		i = 0;
		weekGames.forEach(async (g) => {

			let awayLine = await getLine(g.week, g.id, "away_team");
			let homeLine = await getLine(g.week, g.id, "home_team");
			let final = await getFinal(g.week, g.id);
			let awayScore = await getScore(g.week, g.id, "away_team");
			let homeScore = await getScore(g.week, g.id, "home_team");

			games[i] = new Game(g.id, g.awayTeam, g.homeTeam, g.date, g.time, awayLine, homeLine, awayScore, homeScore, final, week);

			i++;
		});
		resolve(games);
	});
}

const populateWeeklySchedule = async (thisWeek) => {
	
	let header ="<th>Away</th>" +
				"<th></th>" +
				"<th>Home</th>" +
				"<th>Day</th>" +
				"<th>Time (Eastern)</th>" + 
				"<th>Score</th>";

	await sleep(500);

	let data = await getGuts(thisWeek);

	let table = TABLE_OPEN + header + data + TABLE_CLOSE;

	$("#this_week_games").html(table);
}

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
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

const getGuts = async (weekGames) => {

	await sleep(1250);

	let guts = "";

	weekGames.forEach(g => {

		//isGameLocked(g.date, g.time)

		guts += TR_OPEN + 
			getTeamCard(g.awayTeam, g.awayLine, false) +
			TD_OPEN + "@" + TD_CLOSE + 
			getTeamCard(g.homeTeam, g.homeLine, false) +
			TD_OPEN + g.date + TD_CLOSE +
			TD_OPEN + g.time + TD_CLOSE +
			TD_OPEN + (g.final ? "FINAL: " : "") +
			getProperAbbr(g.awayTeam.Abbreviation) + " " + g.awayScore + " - " + g.homeScore + " " + getProperAbbr(g.homeTeam.Abbreviation) + TD_CLOSE +
		TR_CLOSE;
	});


	return guts;
}

const isGameLocked = (gameDate, gameTime) => {
	let nowDate = new Date();

	let gameStart = convertTimeForComputerReadable(gameDate, gameTime);

	let lockTime = new Date(gameStart.getTime() - (30 * 60000))

	let easternNowTime = new Date().toLocaleString("en-US", {timeZone: "America/New_York"})

	if(togglz.testingDate) {
		easternNowTime = new Date(testDate.year, testDate.month, testDate.day, testDate.hour, testDate.minute).toLocaleString("en-US", {timeZone: "America/New_York"});
	}

	let compareLockTime = new Date(lockTime).toLocaleString("en-US", {timeZone: "America/New_York"});

	if(compareLockTime < easternNowTime) {
		return true;
	} else {
		return false;
	}
	
}

const convertTimeForComputerReadable = (date, time) => {
	
	let am_pm = time.substring(time.length - 2);
	time = time.substring(0, time.length - 2);

	time = time.split(":");
	hours = parseInt(time[0]);
	minutes = parseInt(time[1]);
	hours = (am_pm == "PM" && hours != 12 ? hours + 12 : hours);

	date = date.split("-");

	let year = parseInt(date[0]);
	let month = parseInt(date[1] - 1);
	let day = parseInt(date[2]);

	let gameStart = new Date(year, month, day, hours, minutes);

	return gameStart;

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

const getFinal = async (week, id) => {
	let lines = await getThisWeekLines(week);

	try {
		if(!lines.game[id].final){
			return Promise.resolve(false);
		}
		
		return lines.game[id].final;

	} catch {
		return Promise.resolve(false);
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

	let promiseSchedule = new Promise(function(resolve, reject) {
		resolve(getSchedule());
	});

	await sleep(500);

	promiseSchedule.then(
		async result => {

			schedule = result;

			let gameWeek = new Promise(async function(resolve, reject) {
			 	resolve(getGameWeek());
			});

			gameWeek.then(
				async result => {
					
					$("#select_week_dropdown").val(result);
					$("#select_week_dropdown_admin").val(result);	
					await loadSpecificWeekMatchups(result);

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

const invalidateSubmitButton = async (selectedWeek) => {
	let gameWeek = await getGameWeek();
	
	if(selectedWeek != gameWeek && togglz.disableOtherWeekSubmissions) {
		$("#submit-button").attr("disabled", true);
	} else {
		$("#submit-button").attr("disabled", false);
	}
}

const getPickInfoFromAbbr = (abbr) => {

	
	console.log(games);
	let game = games.filter(g => g.homeTeam.Abbreviation == abbr || g.awayTeam.Abbreviation == abbr); 

	if(game[0].homeTeam.Abbreviation == abbr) {
		return new Pick(game[0].homeTeam.Abbreviation, game[0].awayTeam.Abbreviation, game[0].homeLine, game[0].id, game[0].date, game[0].time, game[0].week);
	} else {
		return new Pick(game[0].awayTeam.Abbreviation, game[0].homeTeam.Abbreviation, game[0].awayLine, game[0].id, game[0].date, game[0].time, game[0].week);
	}
}

const validatePicks = async () => {

	let selectedWeek = $("#select_week_dropdown").val();

	if(selectedWeek != getGameWeek() && togglz.disableOtherWeekSubmissions) {
		alert("Failed to submit. Wrong week.");
	}

	cardChoices = [ ...$(".team_option")];

	cardPicks = cardChoices.filter(c => c.hasAttribute("selected"));

	choices = cardPicks.map(c => c.abbr);

	picks = choices.filter(c => c != "NONE");

	let pickOptionsForSelectedWeek = await getWeekOfGames(selectedWeek);

	let currentPicksSubmitted = await new Promise(async function(resolve, reject) {
		resolve(fetchPicksIfSelected(selectedWeek));
	});


	let lockedPicks = [] 
	if(currentPicksSubmitted) {
		let pickedAlready1 = currentPicksSubmitted.pick_1;
		let pickedAlready2 = currentPicksSubmitted.pick_2;
		let pickedAlready3 = currentPicksSubmitted.pick_3;

		if(togglz.lockPicks) {
			if(isGameLocked(pickedAlready1.date, pickedAlready1.time)) {
				lockedPicks.push(pickedAlready1);
			}

			if(isGameLocked(pickedAlready2.date, pickedAlready2.time)) {
				lockedPicks.push(pickedAlready2);
			}

			if(isGameLocked(pickedAlready3.date, pickedAlready3.time)) {
				lockedPicks.push(pickedAlready3);
			}
		}

	}

	if(lockedPicks.length === 3) {
		alert("You have previously submitted picks and they're all locked. You can't change your picks now.")
	} else if(lockedPicks.length === 0 && cardPicks.length !== 3) {
		console.log(lockedPicks.length);
		console.log(cardPicks.length);
		alert("Pick 3 and only 3 games");
	} else if(lockedPicks.length > 0 && lockedPicks.length < 3 && (cardPicks.length + lockedPicks.length != 3)) {
		alert("You've already locked " + 
				lockedPicks.length + " pick" + 
				(lockedPicks.length === 1 ? ". " : "s. ") +
				"Select " + (3 - lockedPicks.length) + " replacement pick" + 
				(lockedPicks.length === 1 ? "s " : " ") +
				"to submit.");
	} else {
		var options = {
			'show':true
		};
		submittingPicks = [];

		let lockedToSubmit = [];
	
		lockedPicks.forEach(p => {
			submittingPicks[p.team] = getPickInfoFromAbbr(p.team);
		})

		picks.forEach(p => {
			submittingPicks[p] = getPickInfoFromAbbr(p);

		})

		let display = [];
		for (let [k, v] of Object.entries(submittingPicks)) {
			display.push(getProperAbbr(v.team) + " " + prettyPrintTheLine(v.line) + " against " + getProperAbbr(v.against));
		}

		$("#modal-picks").html(display.join("<br />"));
		$("#submit-modal").modal(options);
	}

}

const getProperAbbr = (abbr) => {
	if(abbr === 'LA') {
		return 'LAR'
	}
	return abbr;
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

		console.log(firstPick);

		let pick_1 = {
			'team': firstPick.team,
			'against': firstPick.against,
			'line': firstPick.line,
			'date': firstPick.date,
			'time': firstPick.time,
			'gameId': firstPick.id,
			'week': gameWeek
		}

		let pick_2 = {
			'team': secondPick.team,
			'against': secondPick.against,
			'line': secondPick.line,
			'date': secondPick.date,
			'time': secondPick.time,
			'gameId': secondPick.id,
			'week': gameWeek
		}

		let pick_3 = {
			'team': thirdPick.team,
			'against': thirdPick.against,
			'line': thirdPick.line,
			'date': thirdPick.date,
			'time': thirdPick.time,
			'gameId': thirdPick.id,
			'week': gameWeek
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


const loadStandings = async () => {
	let fs = firebase.firestore();
	let users = await fs.collection('users');
	users.get().then(function(result) {
			standingsTable = TABLE_OPEN;
			standingsTable += "<tr><th>Name</th><th>Wins</th><th>-</th><th>Losses</th>"
			let html = result.forEach(async function(u) {
				let wins = await fetchUserWinsWithId(u.id);
				let losses = await fetchUserLossesWithId(u.id);

				standingsTable += TR_OPEN +
						TD_OPEN + u.data().name + TD_CLOSE +
						
						TD_OPEN + wins + TD_CLOSE +
						TD_OPEN + " - " + TD_CLOSE +
						TD_OPEN + losses + TD_CLOSE +
						TR_CLOSE

				$("#standings_html").html(standingsTable);
				
			});				
		});
}