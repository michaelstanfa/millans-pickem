let currentGoogleUser;

function UserData(name, email, photoURL, season, admin) {
  this.name = name,
  this.email = email,
  this.photoURL = photoURL,
  this.season = season,
  this.admin = admin;
}

function UserIDAndData(id, userData) {
  this.id = id,
  this.userData = userData;
}

function Season(season) {
  this.season = season;
}

function s_202122(picks, paid) {
  this.picks = picks,
  this.paid = paid;
}

function Weeks(weeks) {
  this.weeks = weeks;
}

function UserWeek(week) {
  this.week = week;
}

function UserPicks( picks) {
  this.picks = picks;
}


function authenticate() {
    if(gapi.auth2.getAuthInstance().isSignedIn.get()){
        return gapi.auth2.getAuthInstance();
    } else {
      return gapi.auth2.getAuthInstance()
          .signIn({scope: "profile"})
          .then(function() {
              console.log("Sign-in successful");

              },
              function(err) { console.error("Error signing in", err); });   
  }
}

function getAuthenticatedUser() {
  let user = authenticate();
  return user;
}

function getSignedIn() {
  return gapi.auth2.getAuthInstance();
}

function loadClient() {
  return gapi.client.load("https://content.googleapis.com/discovery/v1/apis/gmail/v1/rest")
      .then(function() { 
            console.log("GAPI client loaded for API");
            },
            function(err) { console.error("Error loading GAPI client for API", err); });
}

const displayAdminHTML = (display) => {

  if(display) {
    $("#admin_html").attr("hidden", false);
  } else {
    
    $("#admin_access_only").attr("hidden", false);
  }


  
}

async function setUser() {

  await firebase.auth().onAuthStateChanged(async function(user) {

    if(user) {

      wins = await getUserWins(user);
      losses = await getUserLosses(user);

      $("#user_first_last").html(user.displayName);
      $("#user_record").html("(" + wins + "-" + losses + ")");
      $("#login_html").attr("hidden", true);
      await showAdminLink(user);
      await displayPicksHTML(user);
      await hideLoginButton();
    }

  })

}

const getUserWins = async (user) => {

  // let user = firebase.auth().currentUser;
  let fs = firebase.firestore();
  let usersCollection = fs.collection('users');

  let data = await new Promise(function(resolve, reject) {
    resolve(usersCollection.doc(user.uid).collection('seasons').doc('202122').get());
  });
  
  return data.data().wins;

}

const getUserLosses = async (user) => {
  // let user = firebase.auth().currentUser;
  let fs = firebase.firestore();
  let usersCollection = fs.collection('users');

  let data = await new Promise(function(resolve, reject) {
    resolve(usersCollection.doc(user.uid).collection('seasons').doc('202122').get());
  });
  
  return data.data().losses;
}

const calculateRecords = async () => {

  alert("Starting calculation... this will take a few minutes");

  let fs = firebase.firestore();

  let usersCollection = fs.collection('users');

  return usersCollection.get().then(async function(result) {

    let resultSize = result.size
    let userCount = 0;

    await result.forEach(async function(user) {

      

      let linesCollection = await fs.collection('lines');

      let allPicks = [];

      for (let fetchWeek = 1; fetchWeek <= 17; fetchWeek++) {
        allPicks.push(await new Promise(async function(resolve, reject) {
            resolve(fetchUserPicksWithIdAndWeek(fetchWeek, user.id));
        }));

      }

      allPicks = allPicks.filter(function(e) {
        return e !== undefined;
      })

      if(allPicks.length > 0) {

        userCount ++;

        let totalWins = 0;
        let totalLosses = 0;

        await allPicks.forEach(async function(picks) {
        
          let thisWeek = picks.pick_2.week.toString();
          let lines = await getThisWeekLines(thisWeek);

          let pick1 = await picks.pick_1;
          let pick2 = await picks.pick_2;
          let pick3 = await picks.pick_3;

          let win1 = await isWin(lines, pick1);
          if(win1){
            totalWins += 1;
          } else if(win1 === false) {
            totalLosses += 1;
          }

          let win2 = await isWin(lines, pick2);
          if(win2){
            totalWins += 1;
          } else if(win2 === false) {
            totalLosses += 1;
          }

          let win3 = await isWin(lines, pick3);
          if(win3){
            totalWins += 1;
          } else if(win3 === false) {
            totalLosses += 1;
          }

          let userSeason = usersCollection.doc(user.id).collection('seasons').doc('202122');

          let userUpdate = {};
          userUpdate['wins'] = totalWins;
          userUpdate['losses'] = totalLosses;

          userSeason.update(userUpdate);

        })
      } else {
        userCount ++;
      }

      if(userCount === resultSize) {
        alert("Record calculations almost done... please click 'OK' and wait 10 seconds to close the app.");
      }

    });

  });

}

const isWin = async (lines, pick) => {

  if(lines.game[pick.gameId].final === true) {
        let awayScore = lines.game[pick.gameId].away_team.score;
        let homeScore = lines.game[pick.gameId].home_team.score;

        let pickedTeam = getProperAbbr(pick.team);
        let pickedLine = pick.line;

        if(pickedTeam === getProperAbbr(lines.game[pick.gameId].away_team.abbr)) {

          if(parseFloat(lines.game[pick.gameId].away_team.score) + parseFloat(pickedLine) > parseFloat(lines.game[pick.gameId].home_team.score)) {
            return true;
          } else {
            return false;
          }

        } else if(pickedTeam === getProperAbbr(lines.game[pick.gameId].home_team.abbr)) {

          if(parseFloat(lines.game[pick.gameId].home_team.score) + parseFloat(pickedLine) > parseFloat(lines.game[pick.gameId].away_team.score)) {
            return true;
          } else {
            return false;
          }
        }
      
      }
}

const displayPicksHTML = async (user) => {
  $("#picks_html").attr("hidden", false);
  await loadPicksIfSelected($("#select_week_dropdown").val());
}

function hideLoginButton() {

  $("#sign_out").attr("hidden", false);
  $("#login_signup_header").attr("hidden", true);
  $("#sign_in_or_sign_up_to_pick_html").attr("hidden", true);

}

const showAdminLink = async (user) => {

    let fs = firebase.firestore();

    let usersCollection = await fs.collection('users');

    usersCollection.doc(user.uid).get().then(async function(data){

      if(null != data.data() && data.data().admin) {
        $("#admin_link_in_header").attr("hidden", false);

      } else {
        $("#admin_link_in_header").attr("hidden", true);
        await displayAdminHTML(false);
        $("#this_week_games_admin").html("");
        $("#this_week_scores_admin").html("");
      }
    });

}


async function onSignIn(googleUser) {
  console.log('Google Auth Response', googleUser);
  let currentGoogleUser = googleUser;
  // We need to register an Observer on Firebase Auth to make sure auth is initialized.
  let firebaseUser = await firebase.auth().currentUser != null ? firebase.auth().currentUser : null;



  var unsubscribe = firebase.auth().onAuthStateChanged(async function(firebaseUser) {

    unsubscribe();
    // Check if we are already signed-in Firebase with the correct user.
 
    if (!isUserEqual(googleUser, firebaseUser)) {


      // Build Firebase credential with the Google ID token.
      var credential = await firebase.auth.GoogleAuthProvider.credential(
          googleUser.getAuthResponse().id_token);


      await firebase.auth().signInWithCredential(credential).then(async function(user) {
        console.log(user);
        $("#user_first_last").html(user.displayName);
      }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        })
        
        buildUserInFirestore();
    } else {
      $("#user_first_last").html(firebaseUser.displayName);
      
      console.log('User already signed-in Firebase.');

    }
  });

  $("#calculate_record_button").attr("hidden", false);
  $("#user_record").attr("hidden", false);
  
}

function isUserEqual(googleUser, firebaseUser) {
  if (firebaseUser) {
    var providerData = firebaseUser.providerData;
    for (var i = 0; i < providerData.length; i++) {
      if (providerData[i].providerId === firebase.auth.GoogleAuthProvider.PROVIDER_ID &&
          providerData[i].uid === googleUser.getBasicProfile().getId()) {
        // We don't need to reauth the Firebase connection.
        return true;
      }
    }
  }
  return false;
}

async function onSignUp(firstSignUp) {

  let result = await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION).then(
    function() {

      var provider = new firebase.auth.GoogleAuthProvider();

      provider.addScope('profile');
      provider.addScope('email');

      firebase.auth().signInWithRedirect(provider);
      firebase.auth().getRedirectResult().then(function(result) {});

    }
  );

  let year = 202122

  let newSeason = new Season(new s_202122(year, false));

  let newUserData = new UserData(user.displayName, user.email, user.photoURL, newSeason, false);

  let userWithId = new UserIDAndData(user.uid, newUserData);

  console.log(userWithId);


  let fs = firebase.firestore();

  let usersCollection = fs.collection('users');

  usersCollection.doc(user.uid).get().then(function(data){
    alert(data.data());
  });
  
  $("#user_first_last").html(user.displayName);
  $("#picks_html").attr("hidden", false);
  $("#sign_in_or_sign_up_to_pick_html").attr("hidden", true);

  hideLoginButton();

  return true;
}

function signoutProcess() {
  $("#sign_out").attr("hidden", true);
  $("#login_signup_header").attr("hidden", false);
  $("#user_first_last").html("");
  $("#picks_html").attr("hidden", true);
  $("#sign_in_or_sign_up_to_pick_html").attr("hidden", false);
  $("#admin_link_in_header").attr("hidden", true);
  $("#this_week_games_admin").html("");
  $("#this_week_scores_admin").html("");
  $("#admin_access_only").attr("hidden", false);
  $("#calculate_record_button").attr("hidden", true);
  $("#user_record").attr("hidden", true);
}

function signOutWithMessage(message) {

  console.log("signing out " + firebase.auth().currentUser.displayName);
  firebase.auth().signOut().then(function() {
    window.alert(message);
    signoutProcess();
  }).catch(function(error) {
    console.error(error);
  });
}

function signOut() {

  firebase.auth().signOut().then(function() {

    var auth2 = gapi.auth2.getAuthInstance();
    
    auth2.signOut().then(function () {
      // auth2.disconnect();
      console.log('User signed out.');
      signoutProcess()
    });
  
  }).catch(function(error) {
    // An error happened.
  });
}


const setupUserProfilesForYear = async () => {

	let fs = firebase.firestore();
  
	let usersCollection = await fs.collection('users');

  usersCollection.get().then(function(result) {

		result.forEach(function(u) {

      if(usersCollection.doc(u.id).collection('seasons').doc('202122')) {

          let userUpdate = {
            'wins': 0,
            'losses': 0,
            'paid': false
          }

          usersCollection.doc(u.id).collection('seasons').doc('202122').set(userUpdate);

        }      
    });
  });
  
  
  }