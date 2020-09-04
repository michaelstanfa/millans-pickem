const createIfUserNotExist = async () => {
	let fs = firebase.firestore();	
	let usersCollection = fs.collection('users');

	let e = $("#email").val()
	let validEmail = validateEmail(e);

	if(validEmail) {
		let email = await usersCollection.get().then(async function(users) {
			let user;
			await users.forEach(u => {
				if(u.data().email === e) {
					user = u;
				}
				
			});

			return null != user ? user.data().email : null;

		});

		if(null === email) {
			alert("About to sign up via Google - Contact Ryan Millan & Michael Stanfa with any issues.");

			await new Promise(function(resolve, reject) {
				resolve(onSignUp());
			});
			

			let currentUser = firebase.auth().currentUser;
			
			usersCollection.doc(currentUser.uid).set(
			{
				name: currentUser.displayName,
				email: currentUser.email,
				photoURL: currentUser.photoURL
			});

			let thisYear = '202021';

			usersCollection.doc(currentUser.uid).collection('seasons').doc(thisYear).set(
				{
					paid: false
				}
			);



		} else {
			window.alert("Hmmm... looks like this email is already registered. Try signing in with the Google button at the top of this page.");
		}

		window.location.href = "./index.html";
	}

	
}

function validateEmail(mail) 
{
 if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail))
  {
    return true;
  }
    alert("Please enter a valid email address.")
    return false;
}