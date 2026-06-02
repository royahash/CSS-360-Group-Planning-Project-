const eventRequestForm = document.getElementById("eventRequestForm");
const requestMessage = document.getElementById("requestMessage");

const pollButtons = document.querySelectorAll(".poll-btn");

const votes = {
  date: "None",
  time: "None",
  location: "None",
  activity: "None"
};

pollButtons.forEach(function(button) {
  button.addEventListener("click", function() {
    const category = button.dataset.category;
    const option = button.dataset.option;

    votes[category] = option;

    const voteDisplay = document.getElementById(category + "Vote");
    if (voteDisplay) {
      voteDisplay.textContent = option;
    }

    const categoryButtons = document.querySelectorAll(
      '.poll-btn[data-category="' + category + '"]'
    );

    categoryButtons.forEach(function(btn) {
      btn.classList.remove("selected");
    });

    button.classList.add("selected");
  });
});

eventRequestForm.addEventListener("submit", async function(event) {
  event.preventDefault();

  const titleInput =
    document.getElementById("eventTitle") ||
    document.getElementById("title") ||
    document.getElementById("event-title");

  const dateInput =
    document.getElementById("eventDate") ||
    document.getElementById("date") ||
    document.getElementById("event-date");

  const timeInput =
    document.getElementById("eventTime") ||
    document.getElementById("time") ||
    document.getElementById("event-time");

  const locationInput =
    document.getElementById("eventLocation") ||
    document.getElementById("location") ||
    document.getElementById("event-location");

  const descriptionInput =
    document.getElementById("eventDescription") ||
    document.getElementById("description") ||
    document.getElementById("event-description");

  const visibilityInput =
    document.getElementById("visibility") ||
    document.getElementById("eventVisibility");

  const friendSelect =
    document.getElementById("friendSelect") ||
    document.getElementById("friend-select") ||
    document.getElementById("friends");

  const reminderInput =
    document.getElementById("reminderEnabled") ||
    document.getElementById("reminder-enabled");

  const title = titleInput ? titleInput.value.trim() : "";
  const startDate = dateInput ? dateInput.value : "";
  const startTime = timeInput ? timeInput.value : "";
  const location = locationInput ? locationInput.value.trim() : "";
  const description = descriptionInput ? descriptionInput.value.trim() : "";
  const visibility = visibilityInput ? visibilityInput.value : "friends-only";
  const reminderEnabled = reminderInput ? reminderInput.checked : false;

  let invitedUsers = [];

  if (friendSelect) {
    if (friendSelect.multiple) {
      invitedUsers = Array.from(friendSelect.selectedOptions).map(function(option) {
        return option.value;
      });
    } else if (friendSelect.value) {
      invitedUsers = [friendSelect.value];
    }
  }

  if (!title || !startDate) {
    requestMessage.textContent = "Please enter at least an event title and date.";
    requestMessage.style.color = "red";
    return;
  }

  const eventRequestData = {
    title: title,
    startDate: startDate,
    startTime: startTime,
    location: location,
    description: description,
    visibility: visibility,
    invitedUsers: invitedUsers,
    invitedGroups: [],
    reminderEnabled: reminderEnabled,
    reminderMinutesBefore: 30,
    pollOptions: {
      dates: votes.date !== "None" ? [votes.date] : [],
      times: votes.time !== "None" ? [votes.time] : [],
      locations: votes.location !== "None" ? [votes.location] : [],
      activities: votes.activity !== "None" ? [votes.activity] : []
    }
  };

  try {
    const response = await fetch("/api/event-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(eventRequestData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to submit event request.");
    }

    requestMessage.textContent = "Your event request has been submitted and added to the calendar as pending!";
    requestMessage.style.color = "green";

    eventRequestForm.reset();

    votes.date = "None";
    votes.time = "None";
    votes.location = "None";
    votes.activity = "None";

    ["date", "time", "location", "activity"].forEach(function(category) {
      const voteDisplay = document.getElementById(category + "Vote");
      if (voteDisplay) {
        voteDisplay.textContent = "None";
      }
    });

    pollButtons.forEach(function(button) {
      button.classList.remove("selected");
    });

    setTimeout(function() {
      window.location.href = "calendar.html";
    }, 1000);

  } catch (error) {
    console.error("Event request submission error:", error);
    requestMessage.textContent = "There was an error submitting your event request. Please try again.";
    requestMessage.style.color = "red";
  }
});
