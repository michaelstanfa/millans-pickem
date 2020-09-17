async function retrieveSched() {
	let year = "2020";
	return $.ajax
	({
		type: "GET",
		url: "https://api.mysportsfeeds.com/v1.2/pull/nfl/" + year + "-regular/full_game_schedule.json",
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

const loadMatchupsForLineSetting = (week) => {
	if(week != "select") {
		games = [];
		weekGames = schedule.fullgameschedule.gameentry.filter(e => e.week == week);
		let i = 0;
		weekGames.forEach(g => {
			games[i] = new Game(g.id, g.awayTeam, g.homeTeam, g.date, g.time, getLine(week, g.awayTeam), getLine(week, g.homeTeam));
			i++;
		})

		thisWeek = new Week(week, games);
		populateWeeklyScheduleForLines(thisWeek);
	} else {
		$("#this_week_games_admin").html("");
	}
}

async function loadMatchupsForScoreSetting(week) {
	if(week != "select") {
		games = [];
		weekGames = schedule.fullgameschedule.gameentry.filter(e => e.week == week);
		let i = 0;
		weekGames.forEach(g => {
			games[i] = new Game(g.id, g.awayTeam, g.homeTeam, g.date, g.time, getScore(week, g.id, g.awayTeam), getScore(week, g.id, g.homeTeam));
			i++;
		})

		thisWeek = new Week(week, games);
		populateWeeklyScheduleForScores(thisWeek);
	} else {
		$("#this_week_scores_admin").html("");
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

}

const showLines = () => {
	$("#admin_set_scores").attr("hidden", true);
	$("#admin_set_lines").attr("hidden", false);
	$("#lines_or_scores_label").html("Setting Lines");
	$("#admin_manage_users").attr("hidden", true);
}

const showScores = () => {
	$("#admin_set_lines").attr("hidden", true);
	$("#admin_set_scores").attr("hidden", false);
	$("#lines_or_scores_label").html("Setting Scores");
	$("#admin_manage_users").attr("hidden", true);
}

const showUsers = async () => {
	$("#admin_set_lines").attr("hidden", true);
	$("#admin_set_scores").attr("hidden", true);
	$("#admin_manage_users").attr("hidden", false);
	
	await loadUsers();
}

const populateWeeklyScheduleForScores = async (thisWeek) => {

	let thisWeekScores = getThisWeekScores(thisWeek.week);

	$("#this_week_scores_admin").html("");

	thisWeekScores.then(
		result => {

			let table = TABLE_OPEN;

			let data = "";

			let week = result;

			let scoresNotSet = false;

			thisWeek.games.forEach(g => {

				try {

					if(week.game[g.id] != null ) {
						
						g.awayScore = week.game[g.id].away_team.score;
						g.homeScore = week.game[g.id].home_team.score;
						g.final = week.game[g.id].final
			
					} else {
						g.awayScore = 0;
						g.homeScore = 0;
						g.final = false;	
					}
				
				} catch {
					scoresNotSet = true;
					g.awayScore = 0;
					g.homeScore = 0;
					g.final = false;	
				}

				data += TR_OPEN + 
					getTeamCardForAdmin(
										getProperAbbr(g.awayTeam.Abbreviation), 
										(g.awayTeam.Name === "Football Team" ? g.awayTeam.City : g.awayTeam.Name)
										) +
					TD_OPEN + "<input class = 'score' id='" + g.id + "_" + g.awayTeam.Abbreviation + "_score'" + " gameId='" + g.id + "' abbr='" + g.awayTeam.Abbreviation + "' nickname='" + g.awayTeam.Name + "' homeAway='AWAY' type='number' step='1' size='4' value='" + g.awayScore + "'>" + TD_CLOSE +
					TD_OPEN + "@" + TD_CLOSE + 
					getTeamCardForAdmin(
										getProperAbbr(g.homeTeam.Abbreviation), 
										(g.homeTeam.Name === "Football Team" ? g.homeTeam.City : g.homeTeam.Name)
										) +
					TD_OPEN + "<input class = 'score' id='" + g.id + "_" + g.homeTeam.Abbreviation + "_score'" + " gameId='" + g.id + "' abbr='" + g.homeTeam.Abbreviation + "' nickname='" + g.homeTeam.Name + "' homeAway='HOME' type='number' step='1' size='4' value='" + g.homeScore + "'>" + TD_CLOSE +
					TD_OPEN + g.date + TD_CLOSE +
					TD_OPEN + g.time + TD_CLOSE +
					TD_OPEN + "<input " + (g.final ? "checked " : "") + "class = 'final_checkbox' type='checkbox' id='" + g.id + "_final'> Final" + TD_CLOSE +
				TR_CLOSE
			})

			table += data;
			table += TABLE_CLOSE;

			$("#this_week_scores_admin").html(table);
		},
		error => {
			console.log(error);
		}
	);

}

const loadUsers = async () => {

	let week = $("#select_week_dropdown_admin").val();

	fs = firebase.firestore();

	let users = fs.collection('users');

	let usersTable = TABLE_OPEN;

	usersTable += "<tr><th>Name<th>Email</th><th>Admin</th><th>Pick 1</th><th>Pick 2</th><th>Pick 3</th></tr>";

	users.get().then(function(result) {

		$("#lines_or_scores_label").html("Users (" + result.size + ")");
		
		result.forEach(function(u) {
			
			let picks = new Promise(function(resolve, reject) {
				resolve(fetchUserPicksWithIdAndWeek(week, u.id))
			});

			let html = picks.then(result => {

				if(undefined != result) {
					
					usersTable += TR_OPEN +
					TD_OPEN + u.data().name + TD_CLOSE +
					TD_OPEN + u.data().email + TD_CLOSE +
					TD_OPEN + u.data().admin + TD_CLOSE +
					TD_OPEN + getProperAbbr(result.pick_1.team) + " " + result.pick_1.line + TD_CLOSE +
					TD_OPEN + getProperAbbr(result.pick_2.team) + " " + result.pick_2.line + TD_CLOSE +
					TD_OPEN + getProperAbbr(result.pick_3.team) + " " + result.pick_3.line +  TD_CLOSE +
					TR_CLOSE
				} else {
					usersTable += TR_OPEN +
					TD_OPEN + u.data().name + TD_CLOSE +
					TD_OPEN + u.data().email + TD_CLOSE +
					TD_OPEN + u.data().admin + TD_CLOSE +
					TD_OPEN + "NO PICK" + TD_CLOSE +
					TD_OPEN + "NO PICK" + TD_CLOSE +
					TD_OPEN + "NO PICK" + TD_CLOSE +
					TR_CLOSE
				}
				return usersTable;
			})
			html.then(result => {
				$("#admin_see_users").html(usersTable + TABLE_CLOSE);
			});
		});
	});
}

const populateWeeklyScheduleForLines = async (thisWeek) => {

	let thisWeekLines = getThisWeekLines(thisWeek.week);

	$("#this_week_games_admin").html("");

	thisWeekLines.then(
		result => {

			let table = TABLE_OPEN;

			let data = "";

			let week = result;

			let linesNotSet = false;

			thisWeek.games.forEach(g => {

				try {

					if(week.game[g.id] != null ) {
						
						g.awayLine = week.game[g.id].away_team.line;
						g.homeLine = week.game[g.id].home_team.line;

			
					} else {
						g.awayLine = 1.5;
						g.homeLine = -1.5;
				
					}
				
				} catch {
					linesNotSet = true;
					g.awayLine = 1.5;
					g.homeLine = -1.5;

				}

				data += TR_OPEN + 
					getTeamCardForAdmin(
										getProperAbbr(g.awayTeam.Abbreviation), 
										(g.awayTeam.Name === "Football Team" ? g.awayTeam.City : g.awayTeam.Name)
										) +
					TD_OPEN + "<input class = 'line' id='" + g.id + "_" + g.awayTeam.Abbreviation + "_line'" + " gameId='" + g.id + "' abbr='" + g.awayTeam.Abbreviation + "' nickname='" + g.awayTeam.Name + "' homeAway='AWAY' oninput='changeThisLine(" + g.id + "," + "\"" + g.id + "_" + g.homeTeam.Abbreviation + "_line" + "\"" + ", this.value, \"away\")' type='number' step='1' size='4' value='" + g.awayLine + "'>" + TD_CLOSE +
					TD_OPEN + "@" + TD_CLOSE + 
					getTeamCardForAdmin(
										getProperAbbr(g.homeTeam.Abbreviation), 
										(g.homeTeam.Name === "Football Team" ? g.homeTeam.City : g.homeTeam.Name)
										) +
					TD_OPEN + "<input class = 'line' id='" + g.id + "_" + g.homeTeam.Abbreviation + "_line'" + " gameId='" + g.id + "' abbr='" + g.homeTeam.Abbreviation + "' nickname='" + g.homeTeam.Name + "' homeAway='HOME' oninput='changeThisLine(" + g.id + "," + "\"" + g.id + "_" + g.awayTeam.Abbreviation + "_line" + "\"" + ", this.value, \"home\")' type='number' step='1' size='4' value='" + g.homeLine + "'>" + TD_CLOSE +
					TD_OPEN + g.date + TD_CLOSE +
					TD_OPEN + g.time + TD_CLOSE +
				TR_CLOSE
			})

			table += data;
			table += TABLE_CLOSE;

			if(linesNotSet) {
				alert("Lines haven't been set for this week. Defaulting to +/- 1.5. Nothing will be saved until you submit.")
			}

			$("#this_week_games_admin").html(table);
		},
		error => {
			console.log(error);
		});
	
}


const setScores = () => {
	let scores = [ ...$(".score")];

	let allIds = new Set();

	scores.forEach(s => {
		allIds.add(s.getAttribute("gameId"));
	});

	let pushScoreUpdate = [];

	let data = {};

	allIds.forEach(id => {
		let idScores = scores.filter(s => s.getAttribute("gameId") == id);
		let away = idScores.filter(s => s.getAttribute('homeaway') == "AWAY");
		let home = idScores.filter(s => s.getAttribute('homeaway') == "HOME");
		let final = $("#" + id + "_final");
		

		data[id] = {
			final: final[0].checked,
			away_team: {
				score: away[0].value
			},
			home_team: {
				score: home[0].value
			}
		}

	})

	let fs = firebase.firestore();	
	
	let linesCollection = fs.collection('lines');
	
	let year = linesCollection.doc('202021');

	let week = year.collection('week');

	let weekX = week.doc($("#select_week_dropdown_admin").val());



	weekX.get().then(function(doc) {

		for (let [k, v] of Object.entries(doc.data().game)) {

			let gameUpdate = {};
			gameUpdate[`game.${k}.away_team.score`] = data[k].away_team.score;
			weekX.update(gameUpdate);

			gameUpdate[`game.${k}.home_team.score`] = data[k].home_team.score;
			weekX.update(gameUpdate);

			gameUpdate[`game.${k}.final`] = data[k].final;
			weekX.update(gameUpdate);

		}

		alert("Scores updated");
	})


}

const reviewLines = async () => {

	let gameWeek = await getWeekOfGames($("#select_week_dropdown_admin").val());

	let lines = [ ...$(".line")];
	
	let allIds = new Set();

	lines.forEach(l => {
		allIds.add(l.getAttribute("gameId"));

	});
	let pushLineUpdate = [];

	let data = {};
	allIds.forEach(id => {

		let idLines = lines.filter(l => l.getAttribute("gameId") == id);

		let away = idLines.filter(l => l.getAttribute('homeaway') == "AWAY");
		let home = idLines.filter(l => l.getAttribute('homeaway') == "HOME")

		let scheduleGame = gameWeek.filter(w => w.id == id);
		data[id] = {
			date: scheduleGame[0].date,
			time: scheduleGame[0].time,
			final: false,
			away_team: {
				line: away[0].value,
				name: away[0].getAttribute('nickname'),
				score: 0,
				abbr: away[0].getAttribute('abbr')

			},
			home_team: {
				line: home[0].value,
				name: home[0].getAttribute('nickname'),
				score: 0,
				abbr: home[0].getAttribute('abbr')
			}
		}

	})

	let weekUpdate = {}

	let game = {
		game:data
	}

	weekUpdate[$("#select_week_dropdown_admin").val()] = {
		game :
			data
	}

	let fs = firebase.firestore();
	let linesCollection = fs.collection('lines');
	
	let year = linesCollection.doc('202021');

	let week = year.collection('week');

	let weekX = week.doc($("#select_week_dropdown_admin").val());

	let setDoc = weekX.set(game);

	console.log(game);

	setDoc.then(window.alert("Lines saved"));

}