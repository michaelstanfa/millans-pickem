const getThisYearLinesFromFirebase = async () => {
//gotta check to see if the lines for this week have been loaded yet
	let fs = firebase.firestore();
	
	let lines = fs.collection('lines');//('lines/201920/week/1/game/51461/away_team/line');
	
	let year = lines.doc('201920');

	return new Promise(function(resolve, reject) {
		resolve(year.get().then(doc => doc.data()));
	});

}