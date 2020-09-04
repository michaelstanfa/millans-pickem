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

			let signedUp = await new Promise(async function(resolve, reject) {
				console.log("about to sign up");
				resolve(onSignUp(true));
			});
		

			if(signedUp) {
				console.log("user signed up");
				let currentUser = await firebase.auth().currentUser;
				console.log(currentUser);
				usersCollection.doc(currentUser.uid).set(
				{
					name: currentUser.displayName,
					email: currentUser.email,
					photoURL: currentUser.photoURL,
					admin: false
				});

				let thisYear = '202021';

				await usersCollection.doc(currentUser.uid).collection('seasons').doc(thisYear).set(
					{
						paid: false
					}
				);

				window.location.href = "./index.html";
			}

		} else {
			window.alert("Hmmm... looks like this email is already registered. Try signing in with the Google button at the top of this page.");

			window.location.href = "./index.html";
		}

		
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