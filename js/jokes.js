document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.splide')) {
        new Splide('.splide').mount();
    }

    const modal = document.getElementById('joke-modal');
    const modalJokeText = document.getElementById('modal-joke-text');
    const closeBtn = document.querySelector('.close-btn');
    const copyBtn = document.getElementById('copy-joke-btn');

    document.querySelectorAll('.splide__slide').forEach(slide => {
        slide.addEventListener('click', () => {
            const jokeText = slide.dataset.jokeText;
            modalJokeText.textContent = jokeText;
            modal.style.display = 'block';
        });
    });

    if(closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    if(copyBtn) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(modalJokeText.textContent).then(() => {
                alert('Joke copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });
});
