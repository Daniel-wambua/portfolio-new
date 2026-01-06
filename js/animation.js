document.addEventListener('DOMContentLoaded', function() {
    initAnimate();
});

function initAnimate() {
    const projectCards = document.querySelectorAll('.animate-card');
    projectCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    const socialIcons = document.querySelectorAll('.social-icon');
    socialIcons.forEach(icon => {
        icon.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
        });
        icon.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
    setTimeout(() => {
        const tweets = document.querySelectorAll('.twitter-tweet,.tweet-cards blockquote');
        tweets.forEach(tweet => {
            tweet.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-3px)';
            });
            tweet.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
    }, 2000);
}