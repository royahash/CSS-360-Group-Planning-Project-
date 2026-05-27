const eventRequestForm = document.getElementById('eventRequestForm');
const requestMessage = document.getElementById('requestMessage');

eventRequestForm.addEventListener('submit', function (event) {
  event.preventDefault();

  requestMessage.textContent = 'Your event request has been submitted!';
  eventRequestForm.reset();
});

const pollButtons = document.querySelectorAll('.poll-btn');

const votes = {
  date: 'None',
  time: 'None',
  location: 'None',
  activity: 'None',
};

pollButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    const category = button.dataset.category;
    const option = button.dataset.option;

    votes[category] = option;

    document.getElementById(category + 'Vote').textContent = option;

    const categoryButtons = document.querySelectorAll(
      '.poll-btn[data-category="' + category + '"]',
    );

    categoryButtons.forEach(function (btn) {
      btn.classList.remove('selected');
    });

    button.classList.add('selected');
  });
});
