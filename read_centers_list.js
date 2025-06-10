const admin = require('firebase-admin');

// --- Firebase Admin SDK Initialization ---
try {
    admin.initializeApp(); // Assumes GOOGLE_APPLICATION_CREDENTIALS is set
    console.log("Firebase Admin SDK initialized.");
} catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error.message);
    console.log("--------------------------------------------------------------------------------");
    console.log("SIMULATION MODE: Will proceed to infer structure from code if direct read fails.");
    console.log("--------------------------------------------------------------------------------\n");
    // process.exit(1); // For actual execution, you'd exit. For this multi-step task, we allow it to continue to inference.
}

const db = admin.firestore();

async function readSomeCenters() {
    console.log("Attempting to read up to 3 documents from 'centers_list' collection...");
    let centers = [];
    try {
        const centersRef = db.collection('centers_list').limit(3); // Limit to 3 documents
        const snapshot = await centersRef.get();

        if (snapshot.empty) {
            console.log('No documents found in centers_list.');
            return null; // Indicate no data found
        }

        console.log('\n--- Sample Centers List Documents ---');
        snapshot.forEach(doc => {
            console.log(`Document ID: ${doc.id}`);
            const data = doc.data();
            console.log('Data:', JSON.stringify(data, null, 2));
            centers.push({id: doc.id, data: data});
            console.log('---');
        });
        console.log('\nSuccessfully read documents from centers_list.');
        return centers; // Return the fetched data

    } catch (error) {
        console.error('Error reading from Firestore centers_list:', error.message);
        if (error.code === 'permission-denied' || error.code === 7 || error.message.includes("PROJECT_ID")) {
             console.error('This is likely due to Firestore security rules or missing/incorrect Admin SDK permissions/initialization.');
        }
        return null; // Indicate error
    }
}

// This self-invoking function is just for the script execution.
// The main goal is to define readSomeCenters for potential use or to trigger the error for inference.
(async () => {
    const fetchedCenters = await readSomeCenters();
    if (fetchedCenters === null) {
        console.log("\nProceeding to infer structure based on script analysis as direct read failed or yielded no data.");
        // Here, in a more complex agent, you would trigger the inference step.
        // For this tool-based approach, the next step in the thought process will handle inference.
    } else if (fetchedCenters.length > 0) {
        console.log("\nSuccessfully fetched data directly from Firestore.");
    } else { // Empty but no error
        console.log("\nNo documents found in Firestore, but the connection was successful. Structure inference might still be useful.");
    }
})();
