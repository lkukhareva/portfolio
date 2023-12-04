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
const downloadButton = document.getElementById("downloadButton");

const fileURL = "resume.pdf"; 
downloadButton.addEventListener("click", function () {
    const anchor = document.createElement("a");
    anchor.href = fileURL;
    anchor.download = "Resume_Lizaveta_Kukharava_UX_Designer.pdf"; 

    document.body.appendChild(anchor);
    anchor.click();

    document.body.removeChild(anchor);
});