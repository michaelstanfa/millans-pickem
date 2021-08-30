let firebaseYear = "202122"

const getThisYearLinesFromFirebase = async () => {
//gotta check to see if the lines for this week have been loaded yet
	let fs = firebase.firestore();
	
	let lines = fs.collection('lines');//('lines/201920/week/1/game/51461/away_team/line');
	
	let year = lines.doc(firebaseYear);

	return new Promise(function(resolve, reject) {
		resolve(year.get().then(doc => doc.data()));
	});

}

const getThisWeekLines = async (week) => {

	let fs = firebase.firestore();
	
	let lines = await fs.collection('lines');//('lines/201920/week/1/game/51461/away_team/line');
	
	let year = await lines.doc(firebaseYear);

	let weekLines = await lines.doc(firebaseYear).collection('week');

	return new Promise(function(resolve, reject) {
		resolve(year.collection('week').doc(week.toString()).get().then(doc => doc.data()));
	})
}


const getThisWeekScores = async (week) => {

	let fs = firebase.firestore();
	
	let lines = fs.collection('lines');//('lines/201920/week/1/game/51461/away_team/line');
	
	let year = lines.doc(firebaseYear);

	let weekLines = lines.doc(firebaseYear).collection('week');
	
	return new Promise(function(resolve, reject) {
		resolve(year.collection('week').doc(week.toString()).get().then(doc => doc.data()));
	})
}