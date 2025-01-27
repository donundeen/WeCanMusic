class NewScore {
    constructor(divID) {
        this.barsMap = {};
        this.copiedBars = [];
        this.highlightedBar = null;
        this.highlightedBeat = null;
        this.barsContainer = document.getElementById(divID);
        this.selectedBarNumbers = [];
        this.changeCallback = null;
        this.init();
    }

    init() {
        this.barsContainer.innerHTML = ''; // Clear existing content
        this.setupEventListeners();
    }

    scoreChanged() {
        if(this.changeCallback){
            this.changeCallback();
        }
    }

    setupEventListeners() {
        let self = this;
        
        document.addEventListener('keydown', (e) => {
            console.log("keydown", document.activeElement);
        });
             

        this.barsContainer.addEventListener('focus', (e) => {
            console.log("focus", e.target);
        });

        this.barsContainer.addEventListener('keydown', (e) => {
            console.log("keydown", e.key);
            if (e.key === 'c' && e.ctrlKey) { // Ctrl + C to copy
                console.log("copySelectedBars");
                self.copySelectedBars();
            } else if (e.key === 'v' && e.ctrlKey) { // Ctrl + V to paste
                console.log("pasteCopiedBars");
                self.pasteCopiedBars();
                self.scoreChanged();

            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                const selectedBars = this.barsContainer.querySelectorAll('.bar.selected');
                selectedBars.forEach(selectedBar => {
                    selectedBar.remove();
                });
                this.updateNumbers(); // Update numbering after deletion
                this.scoreChanged();

            } else if (e.key === '+') {
                const selectedBars = this.barsContainer.querySelectorAll('.bar.selected');
                const newBar = this.createBar();

                if (selectedBars.length > 0) {
                    const lastSelectedBar = selectedBars[selectedBars.length - 1];
                    lastSelectedBar.parentNode.insertBefore(newBar, lastSelectedBar.nextSibling);
                } else {
                    this.barsContainer.insertBefore(newBar, scoreDiv.firstChild); // Add before all other bars
                }
                this.updateNumbers(); // Update numbering after addition
                this.scoreChanged();
            } else if (e.key === 'ArrowRight') { // Add this block for moving selected bars forward
                let selectedBars = this.barsContainer.querySelectorAll('.bar.selected');
                selectedBars = Array.from(selectedBars).reverse();
                selectedBars.forEach(selectedBar => {
                    if(!selectedBar.previousElementSibling ||!selectedBar.previousElementSibling.classList.contains('selected')){    
                        let nextBar = selectedBar.nextElementSibling;
                        while(nextBar && nextBar.classList.contains('selected')){
                            nextBar = nextBar.nextElementSibling;
                        }
                        if (nextBar && nextBar.classList.contains('bar')) {
                            selectedBar.parentNode.insertBefore(nextBar, selectedBar); // Move next bar before the selected bar
                        }
                    }
                });
                this.updateNumbers(); // Update numbering after moving
                this.scoreChanged();

            } else if (e.key === 'ArrowLeft') { // Move selected bars backward
                const selectedBars = Array.from(this.barsContainer.querySelectorAll('.bar.selected'));
                if (selectedBars.length > 0) {
                    let firstSelectedBar = selectedBars[0];
                    let previousBar = firstSelectedBar.previousElementSibling;

                    if (previousBar && previousBar.classList.contains('bar')) {
                        selectedBars.forEach(selectedBar => {
                            previousBar = selectedBar.previousElementSibling;
                            const parent = selectedBar.parentNode;
                            parent.insertBefore(selectedBar, previousBar); // Move each selected bar before the previous bar
                        });
                        this.updateNumbers(); // Update numbering after moving
                        this.scoreChanged();

                    }
                }
            } else if (e.key === 'Enter') { // Open the first selected element for editing
                console.log("enter in score");
            
            } 
                
            // Add other keydown logic as needed
        });
    }

    createBar() {
        let bar = document.createElement('div');
        bar.className = 'bar';
        bar.innerHTML = `<div class="number"></div>
                         <div class="beat" contenteditable="true"></div>
                         <div class="beat" contenteditable="true"></div>
                         <div class="beat" contenteditable="true"></div>
                         <div class="beat" contenteditable="true"></div>`;
        bar.setAttribute('draggable', true);
        this.attachBarEvents(bar);
        return bar;
    }

    attachBarEvents(bar){
        bar.addEventListener('dragstart', (e) => {
            const selectedBars = this.barsContainer.querySelectorAll('.bar.selected');
            const selectedTexts = Array.from(selectedBars).map(selectedBar => {
                return Array.from(selectedBar.querySelectorAll('.beat')).map(beat => beat.innerText).join(', ');
            });
            e.dataTransfer.setData('text/plain', JSON.stringify(selectedTexts));
            e.dataTransfer.effectAllowed = 'move';
        });

        bar.addEventListener('dragover', (e) => {
            e.preventDefault(); // Allow drop
        });

        bar.addEventListener('drop', (e) => {
            e.preventDefault();
            const draggedTexts = JSON.parse(e.dataTransfer.getData('text/plain'));
            let target = e.target;
            if(!target.classList.contains('bar')){
                target = target.parentNode;
            }
            console.log(target);
            if (target.classList.contains('bar')) {
                const parent = target.parentNode;
                const targetIndex = Array.from(parent.children).indexOf(target);
                const selectedBars = Array.from(parent.querySelectorAll('.bar.selected'));

                // Insert dragged elements in the order they were selected
                /*DO NOT CHANGE THIS CODE*/
                selectedBars.forEach(draggedElement => {
                    console.log(draggedElement);
                    parent.insertBefore(draggedElement, target);
                });
                /* END DO NOT CHANGE THIS CODE*/

                this.updateNumbers(); // Update numberinshg after drop
                this.scoreChanged();
            }
        });

        bar.addEventListener('click', (e) => {
            console.log(" bar click", e.target);
            this.barsContainer.focus();
            if (e.shiftKey && this.lastSelectedIndex !== -1) {
                // Select range of bars
                const bars = this.barsContainer .querySelectorAll('.bar');
                const currentIndex = Array.from(bars).indexOf(bar);
                const start = Math.min(this.lastSelectedIndex, currentIndex);
                const end = Math.max(this.lastSelectedIndex, currentIndex);
                for (let i = start; i <= end; i++) {
                    bars[i].classList.add('selected');
                }
            } else {
                // Toggle selection of the clicked bar
                bar.classList.toggle('selected');
            }
            this.lastSelectedIndex = Array.from(this.barsContainer.querySelectorAll('.bar')).indexOf(bar); // Update last selected index
            this.barsContainer.focus();

        });

        // Add event listener for the beat divs
        const beats = bar.querySelectorAll('.beat');
        let self = this;
        beats.forEach(beat => {
            let originalText = beat.innerText; // Store the original text content

            beat.addEventListener('click', () => {
                console.log("beat click", beat.innerText);
            });

            beat.addEventListener('focus', () => {
                console.log("beat focus", beat.innerText);
                originalText = beat.innerText; // Update original text on focus
            });

            beat.addEventListener('blur', () => {
                console.log("beat blur", beat.innerText);
                if (beat.innerText !== originalText) {
                    // Trigger an event or perform an action if the text has changed
                    console.log(`Text changed in beat: ${beat.innerText}`);
                    self.scoreChanged();
                    // You can also dispatch a custom event here if needed
                }
            });

            beat.addEventListener('keydown', (e) => {
                if (e.key === 'Delete' || e.key === 'Backspace' || e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                    e.stopPropagation(); // Prevent the event from bubbling up
                }
            });
        });
        return bar;
    }

    copySelectedBars() {
        const selectedBars = this.barsContainer.querySelectorAll('.bar.selected');
        this.copiedBars = Array.from(selectedBars).map(bar => {
            return bar.cloneNode(true); // Clone the selected bar
        });
    }

    pasteCopiedBars() {
        const selectedBars = this.barsContainer.querySelectorAll('.bar.selected');
        console.log(this.copiedBars);
        let lastSelectedBar = null;
        if (selectedBars.length > 0) {
            lastSelectedBar = selectedBars[selectedBars.length - 1];
        }
        // Sort copiedBars by bar number in descending order
        const sortedCopiedBars = Array.from(this.copiedBars).sort((a, b) => {
            const aBarNumber = parseInt(a.querySelector('.number').innerText, 10);
            const bBarNumber = parseInt(b.querySelector('.number').innerText, 10);
            return bBarNumber - aBarNumber; // Sort in descending order
        });        

        // Insert sorted copied bars after the last selected bar
        sortedCopiedBars.forEach(copiedBar => {
            const newBar = copiedBar.cloneNode(true); // Clone the copied bar
            this.attachBarEvents(newBar);
            if(lastSelectedBar){
                this.barsContainer.insertBefore(newBar, lastSelectedBar.nextSibling); // Insert after the last selected bar
            } else {
                this.barsContainer.prepend(newBar); // Append the new bar to the container
            }
        });
        this.updateNumbers(); // Update numbering after pasting
    }

    textToScore(text) {
        // Populate selectedBarNumbers with the numbers of all selected bars
        this.selectedBarNumbers = Array.from(this.barsContainer.querySelectorAll('.bar.selected')).map(bar => {
            return Array.from(this.barsContainer.children).indexOf(bar) + 1; // Store bar numbers (1-based)
        });

        this.barsContainer.innerHTML = ''; // Clear existing content in the score div
        const lines = text.trim().split('\n'); // Split the input text into lines

        let lastBarNumber = 0; // Track the last processed bar number
        this.barsMap = {};

        lines.forEach(line => {
            const [barBeat, ...contentParts] = line.split(' ');
            const [barNumber, beatNumber] = barBeat.split(':').map(Number); // Parse bar and beat numbers
            const textContent = contentParts.join(' '); // Join the remaining parts as text content

            // Create empty bars for any gaps between lastBarNumber and barNumber
            for (let i = lastBarNumber + 1; i < barNumber; i++) {
                const blankBar = this.createBar(); // Create a blank bar
                this.barsContainer.appendChild(blankBar); // Append the blank bar to the container
                this.barsMap[i] = blankBar; // Store the blank bar in the map
            }

            // Create the bar if it doesn't exist
            if (!this.barsMap[barNumber]) {
                this.barsMap[barNumber] = this.createBar(); // Create a new bar
                this.barsContainer.appendChild(this.barsMap[barNumber]); // Append the new bar to the container
            }

            // Get the corresponding bar
            const bar = this.barsMap[barNumber];
            const beats = bar.querySelectorAll('.beat');
            const beatIndex = beatNumber - 1; // Convert to zero-based index

            if (beats[beatIndex]) {
                beats[beatIndex].innerText = textContent; // Set the text content
            } else {
                const beatDiv = document.createElement('div');
                beatDiv.className = 'beat';
                beatDiv.contentEditable = true; // Make the beat editable
                beatDiv.innerText = textContent; // Set the text content
                bar.appendChild(beatDiv); // Append the new beat to the bar
            }

            // Update the last processed bar number
            lastBarNumber = barNumber;
        });

        this.updateNumbers(); // Update numbering after creating bars and beats

        // Select bars that were previously selected
        this.selectedBarNumbers.forEach(barNumber => {
            const bar = this.barsMap[barNumber];
            if (bar) {
                bar.classList.add('selected'); // Add selected class to the bar
            }
        });
    }

    scoreToText() {
        const lines = []; // Array to hold the formatted lines
        const bars = this.barsContainer.querySelectorAll('.bar');

        bars.forEach((bar, barIndex) => {
            const beats = bar.querySelectorAll('.beat');
            beats.forEach((beat, beatIndex) => {
                const textContent = beat.innerText.trim(); // Get the text content of the beat
                if (textContent) { // Check if the beat has text content
                    const line = `${barIndex + 1}:${beatIndex + 1} ${textContent}`; // Format the line
                    lines.push(line); // Add the line to the array
                }
            });
        });

        return lines.join('\n'); // Return the formatted lines as a single string
    }

    highlightBeat(barNumber, beatNumber) {
        // Unhighlight previously highlighted elements
        if (this.highlightedBar) {
            this.highlightedBar.classList.remove('highlighted-bar'); // Remove highlight class from the previously highlighted bar
        }
        if (this.highlightedBeat) {
            this.highlightedBeat.classList.remove('highlighted-beat'); // Remove highlight class from the previously highlighted beat
        }

        // Find the bar element based on barNumber
        const bars = this.barsContainer.querySelectorAll('.bar');
        const bar = bars[barNumber - 1]; // Convert to zero-based index

        if (bar) {
            // Highlight the specified bar
            bar.classList.add('highlighted-bar'); // Add highlight class to the bar

            // Find the beat element based on beatNumber
            const beats = bar.querySelectorAll('.beat');
            const beat = beats[beatNumber - 1]; // Convert to zero-based index

            if (beat) {
                // Highlight the specified beat
                beat.classList.add('highlighted-beat'); // Add highlight class to the beat
                this.highlightedBeat = beat; // Update the highlighted beat variable
            }
        }

        // Update the highlighted bar variable
        this.highlightedBar = bar; // Update the highlighted bar variable
    }

    updateNumbers() {
        const bars = this.barsContainer.querySelectorAll('.bar');
        bars.forEach((bar, index) => {
            const numberElement = bar.querySelector('.number');
            if (numberElement) {
                numberElement.innerText = index + 1; // Update the number
            }
        });
    }
}

// Example usage in your HTML file:
// <script src="newScore.js"></script>
// <script>
//     let score = new NewScore('scoreDivID'); // Initialize with the ID of the score div
// </script>
