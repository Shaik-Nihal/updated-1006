document.addEventListener('DOMContentLoaded', () => {
    // Ensure Firebase is initialized (it should be by firebase-config.js)
    if (typeof firebase === 'undefined' || typeof firebase.firestore === 'undefined') {
        console.error("Firebase not initialized. Make sure firebase-config.js is loaded before this script.");
        // Optionally display an error message to the user on the page
        const heroTitleElement = document.getElementById('programs-page-hero-title');
        const programGridElement = document.getElementById('program-grid');
        if (heroTitleElement) {
            heroTitleElement.textContent = "Error Loading Content";
        }
        if (programGridElement) {
            programGridElement.innerHTML = '<p class="error-message">Could not load programs. Please check your connection or try again later.</p>';
        }
        return;
    }

    const db = firebase.firestore();
    /** @type {Array<Object>} Stores all program data fetched from Firestore to enable client-side filtering. */
    let allPrograms = [];
    /** @type {Array<Object>} Stores program data selected by the user for comparison. */
    let selectedForCompare = [];

    // DOM elements for the compare bar
    const compareBar = document.getElementById('compare-bar');
    const compareCountText = document.getElementById('compare-count');
    const compareNowBtn = document.getElementById('compare-now-btn');
    const clearCompareBtn = document.getElementById('clear-compare-btn');

    // DOM elements for the comparison modal
    const compareModal = document.getElementById('compare-modal');
    const closeCompareModalBtn = document.getElementById('close-compare-modal-btn');
    const compareModalTableContainer = document.getElementById('compare-modal-table-container');

    // Fetch and Display Programs Page Hero Content
    async function displayProgramsPageHero() {
        const heroTitleElement = document.getElementById('programs-page-hero-title');
        const heroParagraphElement = document.getElementById('programs-page-hero-paragraph');

        if (!heroTitleElement || !heroParagraphElement) {
            console.error("Programs page hero elements not found in DOM.");
            return;
        }

        try {
            const programsPageCollection = db.collection('programs_page');
            const doc = await programsPageCollection.doc('main_content').get();

            if (doc.exists) {
                const data = doc.data();
                heroTitleElement.textContent = data.heroTitle || "Our Programs"; // Fallback
                heroParagraphElement.textContent = data.heroParagraph || "Explore our comprehensive range of healthcare education programs"; // Fallback
            } else {
                console.log("Programs page hero document ('main_content') not found.");
                // Keep default static content or set specific fallbacks
                heroTitleElement.textContent = "Our Programs (Default)";
                heroParagraphElement.textContent = "Explore our comprehensive range of healthcare education programs (Default)";
            }
        } catch (error) {
            console.error("Error fetching programs page hero content:", error);
            // Keep default static content or display an error
             heroTitleElement.textContent = "Error Loading Title";
             heroParagraphElement.textContent = "Could not load description. Please try again.";
        }
    }

    // Fetch and Display Program Cards
    async function displayProgramCards() {
        const programGridElement = document.getElementById('program-grid');

        if (!programGridElement) {
            console.error("Program grid element not found in DOM.");
            return;
        }

        programGridElement.innerHTML = '<div class="program-card-placeholder"><p>Loading programs...</p></div>'; // Clear and show loading

        try {
            const programsCollection = db.collection('programs');
            const snapshot = await programsCollection.orderBy('order').get();

            if (snapshot.empty) {
                programGridElement.innerHTML = '<p>No programs available at the moment. Please check back later.</p>';
                return;
            }

            programGridElement.innerHTML = ''; // Clear loading message

            allPrograms = []; // Clear previous programs before refetching
            snapshot.forEach(doc => {
                const data = doc.data();
                allPrograms.push({
                    id: doc.id, // Store document ID if needed later
                    ...data,
                    specialization: data.specialization || 'Other' // Handle missing specialization
                });
            });

            filterAndRenderPrograms("All"); // Initial render of all programs

            // Setup filter button event listeners once programs are loaded and initially rendered
            setupFilterEventListeners();

        } catch (error) {
            console.error("Error fetching program cards:", error);
            programGridElement.innerHTML = '<p class="error-message">Error loading programs. Please try refreshing the page.</p>';
            allPrograms = []; // Ensure allPrograms is empty on error
        }
    }

    /**
     * Renders a list of program cards into the program grid.
     * @param {Array<Object>} programsToRender - Array of program objects to display.
     */
    function renderProgramCards(programsToRender) {
        const programGridElement = document.getElementById('program-grid');
        if (!programGridElement) {
            console.error("Program grid element not found for rendering cards.");
            return;
        }

        programGridElement.innerHTML = ''; // Clear existing grid content

        if (programsToRender.length === 0) {
            programGridElement.innerHTML = '<p>No programs match the current filter.</p>';
            return;
        }

        programsToRender.forEach(data => {
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('program-card');

            // Create and append compare checkbox
            const checkboxContainer = document.createElement('div');
            checkboxContainer.classList.add('program-compare-checkbox-container');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `compare-${data.id}`;
            checkbox.classList.add('program-compare-checkbox');
            checkbox.dataset.programId = data.id;
            // Check if this program is already selected (e.g., after re-rendering)
            checkbox.checked = selectedForCompare.some(p => p.id === data.id);


            const label = document.createElement('label');
            label.htmlFor = `compare-${data.id}`;
            label.textContent = 'Add to Compare';

            checkboxContainer.appendChild(checkbox);
            checkboxContainer.appendChild(label);
            cardDiv.appendChild(checkboxContainer); // Add checkbox to the top of the card

            const img = document.createElement('img');
            img.src = data.imageUrl || 'frontend/images/placeholder-program.jpg';
            img.alt = data.title || 'Program image';
            img.loading = 'lazy';

            const contentDiv = document.createElement('div');
            contentDiv.classList.add('program-content');

            const h3 = document.createElement('h3');
            h3.textContent = data.title || 'Untitled Program';

            const p = document.createElement('p');
            p.textContent = data.description || 'No description available.';

            const footerDiv = document.createElement('div');
            footerDiv.classList.add('program-footer');

            const durationSpan = document.createElement('span');
            durationSpan.classList.add('duration');
            durationSpan.innerHTML = `<i class="far fa-clock"></i> ${data.duration || 'N/A'}`;

            const linkA = document.createElement('a');
            linkA.href = data.linkUrl || '#';
            linkA.classList.add('btn');
            linkA.textContent = 'Learn More';

            footerDiv.appendChild(durationSpan);
            footerDiv.appendChild(linkA);

            contentDiv.appendChild(h3);
            contentDiv.appendChild(p);
            contentDiv.appendChild(footerDiv);

            cardDiv.appendChild(img); // Image after checkbox container
            cardDiv.appendChild(contentDiv);

            programGridElement.appendChild(cardDiv);

            // Event listener for the newly created checkbox
            checkbox.addEventListener('change', (event) => {
                const programId = event.target.dataset.programId;
                const programData = allPrograms.find(p => p.id === programId);

                if (!programData) return; // Should not happen

                if (event.target.checked) {
                    if (selectedForCompare.length < 3) {
                        selectedForCompare.push(programData);
                    } else {
                        event.target.checked = false; // Revert checkbox
                        alert("You can only compare up to 3 programs.");
                    }
                } else {
                    selectedForCompare = selectedForCompare.filter(p => p.id !== programId);
                }
                updateCompareBar();
                updateCheckboxStates();
            });
        });
        // After rendering all cards, ensure checkbox states are correct based on current selection
        updateCheckboxStates();
    }

    /**
     * Filters the `allPrograms` array based on the selected specialization and then renders the filtered programs.
     * @param {string} specialization - The specialization to filter by. "All" shows all programs.
     */
    function filterAndRenderPrograms(specialization) {
        if (specialization === "All") {
            renderProgramCards(allPrograms);
        } else {
            const filteredPrograms = allPrograms.filter(program => program.specialization === specialization);
            renderProgramCards(filteredPrograms);
        }
    }

    /**
     * Sets up click event listeners for the filter buttons.
     * This function should be called after `allPrograms` is populated and the initial render is done.
     */
    function setupFilterEventListeners() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        if (!filterButtons || filterButtons.length === 0) {
            console.warn("Filter buttons not found. Filtering functionality will not be available.");
            return;
        }

        filterButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                event.currentTarget.classList.add('active');
                const selectedSpecialization = event.currentTarget.dataset.specialization;
                filterAndRenderPrograms(selectedSpecialization);
            });
        });

        // Event listener for the clear compare button
        if (clearCompareBtn) {
            clearCompareBtn.addEventListener('click', () => {
                selectedForCompare = [];
                document.querySelectorAll('.program-compare-checkbox').forEach(cb => cb.checked = false);
                updateCompareBar();
                updateCheckboxStates();
            });
        } else {
            console.warn("Clear compare button not found.");
        }

        if (compareNowBtn) {
            compareNowBtn.addEventListener('click', () => {
                displayCompareModal();
            });
        } else {
            console.warn("Compare Now button not found.");
        }

        if (closeCompareModalBtn) {
            closeCompareModalBtn.addEventListener('click', () => {
                if(compareModal) compareModal.style.display = 'none';
            });
        } else {
            console.warn("Close compare modal button not found.");
        }

        if (compareModal) {
            compareModal.addEventListener('click', (event) => {
                if (event.target === compareModal) { // Clicked on the overlay itself
                    compareModal.style.display = 'none';
                }
            });
        } else {
            console.warn("Compare modal element not found.");
        }
    }

    /**
     * Updates the compare bar's visibility and text content based on `selectedForCompare` array.
     * Disables/enables the "Compare Now" button based on the number of selected programs.
     */
    function updateCompareBar() {
        if (!compareBar || !compareCountText || !compareNowBtn) {
            console.warn("Compare bar elements not found. Cannot update compare bar.");
            return;
        }
        if (selectedForCompare.length > 0) {
            compareCountText.textContent = `${selectedForCompare.length} program${selectedForCompare.length > 1 ? 's' : ''} selected`;
            compareBar.style.display = 'flex';
        } else {
            compareBar.style.display = 'none';
        }

        if (selectedForCompare.length >= 2) {
            compareNowBtn.disabled = false;
        } else {
            compareNowBtn.disabled = true;
        }
    }

    /**
     * Enables or disables program compare checkboxes based on the number of selected programs.
     * If 3 programs are selected, all other unchecked checkboxes are disabled.
     * Otherwise, all checkboxes are enabled.
     */
    function updateCheckboxStates() {
        const allCheckboxes = document.querySelectorAll('.program-compare-checkbox');
        if (selectedForCompare.length === 3) {
            allCheckboxes.forEach(checkbox => {
                if (!checkbox.checked) {
                    checkbox.disabled = true;
                }
            });
        } else {
            allCheckboxes.forEach(checkbox => {
                checkbox.disabled = false;
            });
        }
    }

    /**
     * Generates and displays the comparison modal with data from `selectedForCompare`.
     */
    function displayCompareModal() {
        if (!compareModal || !compareModalTableContainer) {
            console.error("Comparison modal elements not found.");
            return;
        }

        if (selectedForCompare.length < 2) {
            alert("Please select at least 2 programs to compare.");
            return;
        }

        compareModalTableContainer.innerHTML = ''; // Clear previous table

        const table = document.createElement('table');
        table.classList.add('compare-table');

        // Header Row (Program Titles/Images)
        const headerRow = table.insertRow();
        const attributeHeaderCell = headerRow.insertCell();
        attributeHeaderCell.outerHTML = "<th>Attributes</th>"; // Styled as sticky by CSS

        selectedForCompare.forEach(program => {
            const th = headerRow.insertCell();
            th.innerHTML = `<img src="${program.imageUrl || 'frontend/images/placeholder-program.jpg'}" alt="${program.title || 'Program'}"><br>${program.title || 'N/A'}`;
        });

        // Attribute Rows
        const attributesToCompare = [
            { key: 'description', label: 'Description' },
            { key: 'duration', label: 'Duration' },
            { key: 'specialization', label: 'Specialization' },
            { key: 'eligibility', label: 'Eligibility' }, // Assuming eligibility might exist
            // Add more attributes as needed, ensuring they exist in program data
        ];

        attributesToCompare.forEach(attr => {
            const row = table.insertRow();
            row.insertCell().textContent = attr.label; // Attribute name cell

            selectedForCompare.forEach(program => {
                const cell = row.insertCell();
                let value = program[attr.key] || 'N/A';
                if (attr.key === 'description' && value.length > 100) { // Basic truncation
                    value = value.substring(0, 100) + '...';
                }
                cell.innerHTML = value; // Use innerHTML to render potential HTML in future if needed
            });
        });

        // "Learn More" Link Row
        const linkRow = table.insertRow();
        linkRow.insertCell().textContent = 'More Details';

        selectedForCompare.forEach(program => {
            const cell = linkRow.insertCell();
            cell.innerHTML = `<a href="${program.linkUrl || '#'}" class="btn btn-sm btn-primary" target="_blank">Learn More</a>`;
        });

        compareModalTableContainer.appendChild(table);
        compareModal.style.display = 'flex';
    }

    // Call functions to display content
    displayProgramsPageHero();
    displayProgramCards(); // This will now also trigger initial rendering and filter setup
});
