const eventForm = document.getElementById("eventForm");
const eventCard = document.getElementById("eventCard");

const displayName = document.getElementById("displayName");
const displayDate = document.getElementById("displayDate");
const displayTime = document.getElementById("displayTime");
const displayLocation = document.getElementById("displayLocation");
const responseMessage = document.getElementById("responseMessage");

eventForm.addEventListener("submit", function(event) {
  event.preventDefault();

  const name = document.getElementById("eventName").value;
  const date = document.getElementById("eventDate").value;
  const time = document.getElementById("eventTime").value;
  const location = document.getElementById("eventLocation").value;

  displayName.textContent = name;
  displayDate.textContent = date;
  displayTime.textContent = time;
  displayLocation.textContent = location;

  eventCard.classList.remove("hidden");
  responseMessage.textContent = "";
});

document.getElementById("acceptBtn").addEventListener("click", function() {
  responseMessage.textContent = "You accepted this event!";
  responseMessage.style.color = "green";
});

document.getElementById("denyBtn").addEventListener("click", function() {
  responseMessage.textContent = "You denied this event.";
  responseMessage.style.color = "red";
});
