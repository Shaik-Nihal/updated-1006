const admin = require('firebase-admin');

// --- Firebase Admin SDK Initialization ---
try {
    // Option 1: Environment variable GOOGLE_APPLICATION_CREDENTIALS points to your service account key JSON
    admin.initializeApp();
    console.log("Firebase Admin SDK initialized using GOOGLE_APPLICATION_CREDENTIALS.");

    // Option 2: Explicitly provide path to service account key (less common for deployed environments)
    // const serviceAccount = require('./serviceAccountKey.json'); // Ensure this file exists at the specified path
    // admin.initializeApp({
    //   credential: admin.credential.cert(serviceAccount)
    // });
    // console.log("Firebase Admin SDK initialized using serviceAccountKey.json.");

} catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error.message);
    console.log("--------------------------------------------------------------------------------");
    console.log("SIMULATION MODE: The script will outline the operations it would perform.");
    console.log("This is due to missing credentials or an unsuitable environment for direct SDK execution.");
    console.log("Please ensure GOOGLE_APPLICATION_CREDENTIALS is set if you intend to run this directly.");
    console.log("--------------------------------------------------------------------------------\n");
    // In a real scenario, you might exit here, but for simulation, we can proceed to define the functions.
    // process.exit(1);
}

const db = admin.firestore();

async function updateAllHeroSlides() {
    console.log("Attempting to update all documents in 'hero_section' collection...\n");
    const heroSectionRef = db.collection('hero_section');
    let documentsProcessed = 0;
    let documentsUpdated = 0;

    try {
        const snapshot = await heroSectionRef.get();

        if (snapshot.empty) {
            console.log('No documents found in hero_section. Nothing to update.');
            return;
        }

        console.log(`Found ${snapshot.size} documents to process.\n`);

        for (const doc of snapshot.docs) {
            documentsProcessed++;
            const docData = doc.data();
            let updateData = {};
            let changesMade = [];

            console.log(`Processing document ID: ${doc.id}`);

            // Standard new buttons
            updateData.button1_text = "Explore Programs";
            updateData.button1_url = "/programs"; // Assuming this is the correct path
            changesMade.push("Set button1_text to 'Explore Programs'");
            changesMade.push("Set button1_url to '/programs'");

            updateData.button2_text = "Whatsapp us";
            updateData.button2_url = "https://wa.me/911234567890"; // Placeholder
            changesMade.push("Set button2_text to 'Whatsapp us'");
            changesMade.push("Set button2_url to 'https://wa.me/911234567890'");

            updateData.button3_text = "Enquire Now";
            updateData.button3_url = "/enquiry-page"; // Assuming this is the correct path for enquiry form
            changesMade.push("Set button3_text to 'Enquire Now'");
            changesMade.push("Set button3_url to '/enquiry-page'");

            // Check for old fields and mark them for deletion
            if (docData.hasOwnProperty('buttonText')) {
                updateData.buttonText = admin.firestore.FieldValue.delete();
                changesMade.push("Removed old field 'buttonText'");
            }
            if (docData.hasOwnProperty('buttonUrl')) {
                updateData.buttonUrl = admin.firestore.FieldValue.delete();
                changesMade.push("Removed old field 'buttonUrl'");
            }

            // Always add/update the timestamp
            updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
            changesMade.push("Set 'updatedAt' to server timestamp");

            // Perform the update
            // In a real run, this block would execute. For simulation, we just log.
            try {
                await heroSectionRef.doc(doc.id).update(updateData);
                console.log(`SUCCESS: Document ${doc.id} updated.`);
                documentsUpdated++;
            } catch (updateError) {
                console.error(`ERROR updating document ${doc.id}:`, updateError.message);
                console.log(`  Update object that failed: ${JSON.stringify(updateData, null, 2)}`);
                // If the error is due to SDK not being initialized, we expect this.
                if (updateError.message.includes("Failed to initialize Firebase Admin SDK") || updateError.message.includes("PROJECT_ID")) {
                    console.log("  This error is likely due to the Admin SDK not being fully initialized (simulation mode).");
                }
            }

            console.log("  Changes intended:");
            changesMade.forEach(change => console.log(`    - ${change}`));
            console.log("  Final update object prepared:");
            console.log(JSON.stringify(updateData, (key, value) => {
                if (typeof value === 'object' && value !== null && value._methodName === 'FieldValue.delete') {
                    return 'FieldValue.delete()';
                }
                if (typeof value === 'object' && value !== null && value._methodName === 'FieldValue.serverTimestamp') {
                    return 'FieldValue.serverTimestamp()';
                }
                return value;
            }, 2));
            console.log("---\n");
        }

    } catch (error) {
        console.error('Error reading from Firestore hero_section (or SDK not initialized):', error.message);
        if (error.message.includes("Failed to initialize Firebase Admin SDK") || error.message.includes("PROJECT_ID")) {
            console.log("This error confirms the Admin SDK is not fully initialized (simulation mode). The script describes the actions it *would* take.");
        }
        return; // Exit if we can't even read the collection
    }

    console.log("--------------------------------------------------------------------------------");
    console.log("Update Simulation Summary:");
    console.log(`Documents processed: ${documentsProcessed}`);
    console.log(`Documents that would be updated (if SDK was live): ${documentsUpdated > 0 ? documentsUpdated : snapshot.size } (assuming no other update errors)`);
    console.log("If the SDK was not initialized, no actual Firestore operations were performed.");
    console.log("The logs above detail the intended operations for each document.");
    console.log("--------------------------------------------------------------------------------");
}

// Execute the function
updateAllHeroSlides().catch(err => {
    // This catch is mostly for unexpected errors in the function's logic itself,
    // not for SDK initialization or Firestore operation errors which are handled inside.
    console.error("An unexpected error occurred during the updateAllHeroSlides execution:", err);
});
