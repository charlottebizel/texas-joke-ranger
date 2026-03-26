/**
 * @file Manages the interactive elements on the jokes page.
 * @description This script handles the initialization of the Splide carousel,
 * the functionality of the joke modal (opening, closing, copying text),
 * and other related UI interactions.
 */

document.addEventListener('DOMContentLoaded', () => {

    /**
     * Initializes the Splide carousel if it exists on the page.
     * @see https://splidejs.com/
     */
    if (document.querySelector('.splide')) {
        new Splide('.splide').mount();
    }

    // Modal elements
    const modal = document.getElementById('joke-modal');
    const modalJokeText = document.getElementById('modal-joke-text');
    const closeBtn = document.querySelector('.close-btn');
    const copyBtn = document.getElementById('copy-joke-btn');

    /**
     * Adds click event listeners to all carousel slides.
     * When a slide is clicked, it opens a modal displaying the joke text.
     */
    document.querySelectorAll('.splide__slide').forEach(slide => {
        slide.addEventListener('click', () => {
            const jokeText = slide.dataset.jokeText;
            modalJokeText.textContent = jokeText;
            modal.style.display = 'block';
        });
    });

    /**
     * Adds a click event listener to the modal's close button.
     * Closes the modal when the button is clicked.
     */
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    /**
     * Adds a click event listener to the "Copy Joke" button.
     * Copies the joke text from the modal to the user's clipboard.
     */
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(modalJokeText.textContent).then(() => {
                alert('Joke copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        });
    }

    /**
     * Adds a click event listener to the window.
     * Closes the modal if the user clicks outside of the modal content.
     */
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });
});
