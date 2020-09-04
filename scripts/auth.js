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

function s_202021(picks, paid) {
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

const displayAdminHTML = (userName) => {
  if(userName != "Michael Stanfa" || userName == "Ryan Millan") {
    $("#login_html").attr("hidden", true);
    $("#admin_html").attr("hidden", false);
  } else {
    $("#login_html").attr("hidden", true);
    $("#admin_access_only").attr("hidden", false);
  }
  
}

async function setUser() {

  await firebase.auth().onAuthStateChanged(async function(user) {
    
    
    if(user) {
      $("#user_first_last").html(user.displayName);
      
      await showAdminLink(user);
      await displayAdminHTML(user.displayName);
      await displayPicksHTML(user);
      await hideLoginButton()
    }
  })

}

function displayPicksHTML(user) {
  $("#picks_html").attr("hidden", false);
}

function hideLoginButton() {

  $("#sign_out").attr("hidden", false);
  $("#login_signup_header").attr("hidden", true);
  $("#sign_in_or_sign_up_to_pick_html").attr("hidden", true);

}

async function showAdminLink(user) {

    let fs = firebase.firestore();

    let usersCollection = await fs.collection('users');

    usersCollection.doc(user.uid).get().then(function(data){
      if(null != data.data() && data.data().admin) {
        $("#admin_link_in_header").attr("hidden", false);
      } else {
        $("#admin_link_in_header").attr("hidden", true);
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

      console.log(firebaseUser);
      console.log('User already signed-in Firebase.');
    }
  });
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
  console.log(firstSignUp);

  var user;
  
  let result = await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION).then(
    function() {

      var provider = new firebase.auth.GoogleAuthProvider();

      provider.addScope('profile');
      provider.addScope('email');

      firebase.auth().signInWithRedirect(provider);
      firebase.auth().getRedirectResult().then(function(result) {});

    }
  );

  console.log(result);

  if(result) {
    let signupEmail = $("#email").val();
    console.log(user);
    console.log(signupEmail);
    if(signupEmail != user.email) {
      signOutWithMessage('The email you entered did not match the email that Google used to authenticate you. Try clearing your browser cache and logging in again.');
      return false;
    }

  }

  let year = 202021

  let newSeason = new Season(new s_202021(year, false));

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

async function getUserData() {
  return firebase.auth().currentUser;
}


function signoutProcess() {
  $("#sign_out").attr("hidden", true);
  $("#login_signup_header").attr("hidden", false);
  $("#user_first_last").html("");
  $("#picks_html").attr("hidden", true);
  $("#sign_in_or_sign_up_to_pick_html").attr("hidden", false);
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