const eventForm = document.getElementById('eventForm');
const eventCard = document.getElementById('eventCard');
const displayName = document.getElementById('displayName');
const displayDate = document.getElementById('displayDate');
const displayTime = document.getElementById('displayTime');
const displayLocation = document.getElementById('displayLocation');
const responseMessage = document.getElementById('responseMessage');
const acceptBtn = document.getElementById('acceptBtn');
const denyBtn = document.getElementById('denyBtn');

function formatDate(dateValue) {
  if (!dateValue) return '';

  const date = new Date(`${dateValue}T00:00:00`);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(timeValue) {
  if (!timeValue) return '';

  const [hours, minutes] = timeValue.split(':');
  const date = new Date();
  date.setHours(hours, minutes);

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

eventForm.addEventListener('submit', function (event) {
  event.preventDefault();

  const name = document.getElementById('eventName').value.trim();
  const date = document.getElementById('eventDate').value;
  const time = document.getElementById('eventTime').value;
  const location = document.getElementById('eventLocation').value.trim();

  displayName.textContent = name;
  displayDate.textContent = formatDate(date);
  displayTime.textContent = formatTime(time);
  displayLocation.textContent = location;

  eventCard.classList.remove('hidden');
  responseMessage.textContent = '';
});

acceptBtn.addEventListener('click', function () {
  responseMessage.textContent = 'You accepted this event request!';
  responseMessage.style.color = 'green';
});

denyBtn.addEventListener('click', function () {
  responseMessage.textContent = 'You denied this event request.';
  responseMessage.style.color = 'red';
});
