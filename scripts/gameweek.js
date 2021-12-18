const getGameWeek = async () => {

	//monday of the first game week of the szn
	let final_day_of_week_zero = new Date("09/06/2021");

	let final_day = new Date("01/09/2022");
	let now = new Date();
	now.setHours(0,0,0,0);

	let days_since_start = (now.getTime() - final_day_of_week_zero.getTime()) / (1000 * 60 * 60 *24);	

	if(Math.ceil(days_since_start / 7) > 18) {
		return 1;
	} else if(days_since_start < 0) {
		return 1;
	}
	
	return Math.ceil(days_since_start / 7);
	
}