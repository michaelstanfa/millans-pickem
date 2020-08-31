let currentGoogleUser;

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
  console.log(userName);
  if(userName != "Michael Stanfa" || userName == "Ryan Millan") {
    $("#login_html").attr("hidden", true);
    $("#admin_html").attr("hidden", false);
  } else {
    $("#login_html").attr("hidden", true);
    $("#admin_access_only").attr("hidden", false);
  }
  
}

// function onSignIn(googleUser) {
//   currentGoogleUser = googleUser;
//   var profile = googleUser.getBasicProfile();
//   console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
//   console.log('Name: ' + profile.getName());
//   console.log('Image URL: ' + profile.getImageUrl());
//   console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.
//   console.log(profile);

//   $("#sign_in").attr("hidden", true);
//   $("#sign_out").attr("hidden", false);
//   displayAdminHTML();
//   $("#logged_in_user_first_name").text(" " + getCurrentUserName());
//   $("#user_first_last").text(profile.getName());
//   $("#picks_html").attr("hidden", false);
//   $("#sign_in_or_sign_up_to_pick_html").attr("hidden", true);

//   // location.reload();

// }

async function setUser() {

  firebase.auth().onAuthStateChanged(function(user) {
    if(user) {
      $("#user_first_last").html(user.displayName);

      displayAdminHTML(user.displayName);
      displayPicksHTML(user);
      hideLoginButton()
    }
  })

}

function displayPicksHTML(user) {
  //will need to get individual user info. but for now, just load it.
  console.log("showing picks");
  $("#picks_html").attr("hidden", false);
}

function hideLoginButton() {

  $("#sign_out").attr("hidden", false);
  $("#login_signup_header").attr("hidden", true);

}

async function onSignUp(googleUser) {
  // console.log("signing up user");
  // currentGoogleUser = googleUser;
  // var profile = googleUser.getBasicProfile();
  // console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
  // console.log('Name: ' + profile.getName());
  // console.log('Image URL: ' + profile.getImageUrl());
  // console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.
  // console.log(profile);
  // setupSignupPage();


// Using a popup.

  /*var user = firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(function() {

    // var provider = new firebase.auth.GoogleAuthProvider();
    // In memory persistence will be applied to the signed in Google user
    // even though the persistence was set to 'none' and a page redirect
    // occurred.
    // return firebase.auth().signInWithRedirect(provider);
  })
  .catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
  });*/

  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  var user;
  var provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  await firebase.auth().signInWithPopup(provider).then(function(result) {
   // This gives you a Google Access Token.
   var token = result.credential.accessToken;
   // The signed-in user info.
   user = result.user;

  });

  //setting persistence
  // firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  // .then(function() {
  //   console.log("set persistence?");
  //   console.log(firebase.auth());
  //   // var provider = new firebase.auth.GoogleAuthProvider();
  //   // In memory persistence will be applied to the signed in Google user
  //   // even though the persistence was set to 'none' and a page redirect
  //   // occurred.
  //   // return firebase.auth().signInWithRedirect(provider);
  // })
  // .catch(function(error) {
  //   // Handle Errors here.
  //   var errorCode = error.code;
  //   var errorMessage = error.message;
  // });


  console.log(user);
  //check to see if user is registered already. if so, show their picks and stuff. if not, re-direct to the sign up page. Or just 
  $("#user_first_last").html(user.displayName);
  $("#picks_html").attr("hidden", false);
  $("#sign_in_or_sign_up_to_pick_html").attr("hidden", true);

  hideLoginButton();


/*
  firebase.auth().signInWithPopup(provider).then(function(result) {
    console.log("loggin in with firebase?");
    // This gives you a Google Access Token. You can use it to access the Google API.
    var token = result.credential.accessToken;
    // The signed-in user info.
    var user = result.user;
    console.log(user);


    //now set up the databases for this user


    // ...
  }).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // The email of the user's account used.
    var email = error.email;
    // The firebase.auth.AuthCredential type that was used.
    var credential = error.credential;
    // ...
  });
*/  

}



async function getUserData() {
  console.log(firebase.auth().currentUser);
}

// function signOut() {
//   var auth2 = gapi.auth2.getAuthInstance();
//   auth2.signOut().then(function () {
//     console.log('User signed out.');
//   });

//   $("#sign_out").attr("hidden", true);
//   $("#sign_in").attr("hidden", false);
//   $("#user_first_last").text("");
//   $("#picks_html").attr("hidden", true);
//   $("#sign_in_or_sign_up_to_pick_html").attr("hidden", false);

// }

function signoutProcess() {
  $("#sign_out").attr("hidden", true);
  $("#login_signup_header").attr("hidden", false);
  $("#user_first_last").html("");
  $("#picks_html").attr("hidden", true);
  $("#sign_in_or_sign_up_to_pick_html").attr("hidden", false);
}

function signOutFB() {

  console.log("signing out " + firebase.auth().currentUser.displayName);
  firebase.auth().signOut().then(function() {
    window.alert("Successfully signed out");
    signoutProcess();
}).catch(function(error) {
  console.error(error);
});
}