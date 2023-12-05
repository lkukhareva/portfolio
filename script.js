const burger = document.querySelector(".burger");
const navMenu = document.querySelector(".nav-menu");
const navLink = document.querySelectorAll(".nav-link");

burger.addEventListener("click", mobileMenu);
navLink.forEach(n => n.addEventListener("click", closeMenu));

function mobileMenu() {
    burger.classList.toggle("active");
    navMenu.classList.toggle("active");
}

function closeMenu() {
    burger.classList.remove("active");
    navMenu.classList.remove("active");
}

document.addEventListener('DOMContentLoaded', function () {
    let scrollAmount = 0;
    const cardContainer = document.querySelector('.cards-container');
    const cardWidth = 295; // Width of a single card, adjust it according to your design
    let maxCards = calculateMaxCards(); // Function to calculate the maximum cards to display

    function calculateMaxCards() {
      const screenWidth = window.innerWidth;
      if (screenWidth >= 1400) {
        return 4; // Display 4 cards for large screens
      } else if (screenWidth >= 1144) {
        return 3;
      } else {
        return 2; // Display 2 cards for small screens
      }
    }

    function scrollLeft() {
      scrollAmount += cardWidth * maxCards;
      if (scrollAmount > 0) {
        scrollAmount = 0;
      }
      cardContainer.style.transform = `translateX(${scrollAmount}px)`;
    }

    function scrollRight() {
      scrollAmount -= cardWidth * maxCards;
      const numCards = document.querySelectorAll('.card').length;
      const maxScroll = -(cardWidth * (numCards - maxCards));
      if (scrollAmount < maxScroll) {
        scrollAmount = maxScroll;
      }
      cardContainer.style.transform = `translateX(${scrollAmount}px)`;
    }

    window.addEventListener('resize', function () {
      maxCards = calculateMaxCards();
    });

    const scrollLeftButton = document.getElementById('scrollLeftButton');
    const scrollRightButton = document.getElementById('scrollRightButton');
    scrollLeftButton.addEventListener('click', scrollLeft);
    scrollRightButton.addEventListener('click', scrollRight);
  });