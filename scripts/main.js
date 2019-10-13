let schedule = null;

const loadSpecificWeekMatchups = (week) => {

	if(null == schedule) {
		console.log(week);
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
		    	console.log(JSON.parse(response.responseText));
		    	return schedule;
		   	},
		   	error: function(XMLHttpRequest, textStatus, errorThrown) {
		   		console.log("Failed to make call to endpoint");
		   		console.error("Status: " + textStatus);
		   		console.error("Error: " + errorThrown);
		   	}

		}) 
	} else {
		console.log("schedule already loaded");
	}
}