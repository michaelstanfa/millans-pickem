const getGameWeek = () => {

	let today = new Date();
	let day = today.getDay();
	let month = today.getMonth();
	let year = today.getFullYear();


	//the monday before the first thursday game
	let final_day_of_week_zero = new Date("09/07/2020");

	//last day of the season
	let final_day = new Date("01/03/2021");
	let now = new Date();
	now.setHours(0,0,0,0);

	let days_since_start = (now.getTime() - final_day_of_week_zero.getTime()) / (1000 * 60 * 60 *24);
		
	if(Math.ceil(days_since_start / 7) > 17) {
		return 1;
	} else if(days_since_start < 0) {
		return 1;
	}
	
	return Math.ceil(days_since_start / 7) > 17;
	
}