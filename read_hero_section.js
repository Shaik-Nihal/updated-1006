const admin = require('firebase-admin');

// Attempt to initialize Firebase Admin SDK
try {
    // If GOOGLE_APPLICATION_CREDENTIALS is set, it will be used automatically.
    // Otherwise, you might need to specify the path to your service account key JSON file.
    // For local development, you might use:
    // const serviceAccount = require('./serviceAccountKey.json'); // Assuming the key is in the same directory
    // admin.initializeApp({
    // credential: admin.credential.cert(serviceAccount)
    // });

    // For environments like Google Cloud Functions or App Engine, initializeApp() without arguments
    // often works if the environment is correctly set up.
    admin.initializeApp();

} catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    console.log("Please ensure your Firebase Admin SDK credentials are set up correctly.");
    console.log("If using a serviceAccountKey.json, make sure the path is correct and the file exists.");
    process.exit(1);
}

const db = admin.firestore();

async function readHeroSection() {
    console.log("Attempting to read from 'hero_section' collection...");
    try {
        const heroSectionRef = db.collection('hero_section');
        const snapshot = await heroSectionRef.get();

        if (snapshot.empty) {
            console.log('No documents found in hero_section.');
            return;
        }

        console.log('\n--- Hero Section Documents ---');
        snapshot.forEach(doc => {
            console.log(`Document ID: ${doc.id}`);
            console.log('Data:', JSON.stringify(doc.data(), null, 2));
            console.log('---');
        });
        console.log('\nSuccessfully read all documents from hero_section.');

    } catch (error) {
        console.error('Error reading from Firestore hero_section:', error);
        if (error.code === 'permission-denied' || error.code === 7) { // Common Firestore permission error codes
             console.error('This might be due to Firestore security rules or missing/incorrect Admin SDK permissions.');
        }
    } finally {
        // It's good practice to clean up if the app isn't a long-running server
        // For a simple script, you might not need this, or Firebase might handle it.
        // admin.app().delete().catch(err => console.error("Failed to delete app instance", err));
    }
}

readHeroSection();
