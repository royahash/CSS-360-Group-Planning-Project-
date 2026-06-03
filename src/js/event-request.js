const eventRequestForm = document.getElementById("eventRequestForm");
const requestMessage = document.getElementById("requestMessage");
const pollButtons = document.querySelectorAll(".poll-btn");

const votes = {
  date: "None",
  time: "None",
  location: "None",
  activity: "None"
};

document.addEventListener("DOMContentLoaded", function () {
  loadFriendsIntoDropdown();
});

async function loadFriendsIntoDropdown() {
  const friendSelect = document.getElementById("friendSelect");

  if (!friendSelect) {
    return;
  }

  try {
    const response = await fetch("/api/friends", {
      credentials: "include"
    });

    if (response.status === 401) {
      friendSelect.innerHTML = "";

      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Log in to load friends";
      option.disabled = true;
      friendSelect.appendChild(option);

      return;
    }

    if (!response.ok) {
      throw new Error("Unable to load friends.");
    }

    const friends = await response.json();

    friendSelect.innerHTML = "";

    if (!friends || friends.length === 0) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No friends available";
      option.disabled = true;
      friendSelect.appendChild(option);
      return;
    }

    friends.forEach(function (friend) {
      const option = document.createElement("option");
      option.value = friend._id;
      option.textContent =
        friend.displayName || friend.username || friend.email || "Unnamed friend";

      friendSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Friend dropdown error:", error);

    friendSelect.innerHTML = "";

    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Could not load friends";
    option.disabled = true;
    friendSelect.appendChild(option);
  }
}

pollButtons.forEach(function (button) {
  button.addEventListener("click", function () {
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

    categoryButtons.forEach(function (btn) {
      btn.classList.remove("selected");
    });

    button.classList.add("selected");
  });
});

if (eventRequestForm) {
  eventRequestForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const title = document.getElementById("eventTitle")?.value.trim() || "";
    const startDate = document.getElementById("eventDate")?.value || "";
    const startTime = document.getElementById("eventTime")?.value || "";
    const location = document.getElementById("eventLocation")?.value.trim() || "";
    const description = document.getElementById("eventDescription")?.value.trim() || "";
    const visibility = document.getElementById("visibility")?.value || "friends-only";
    const friendSelect = document.getElementById("friendSelect");
    const reminderEnabled = document.getElementById("reminderEnabled")?.checked || false;

    let invitedUsers = [];

    if (friendSelect) {
      invitedUsers = Array.from(friendSelect.selectedOptions)
        .map(function (option) {
          return option.value;
        })
        .filter(Boolean);
    }

    if (!title || !startDate) {
      showRequestMessage("Please enter at least an event title and date.", "red");
      return;
    }

    if (visibility === "selected-users" && invitedUsers.length === 0) {
      showRequestMessage(
        "Please choose at least one friend for selected-user visibility.",
        "red"
      );
      return;
    }

    const eventRequestData = {
      title,
      startDate,
      startTime,
      location,
      description,
      visibility,
      invitedUsers,
      invitedGroups: [],
      reminderEnabled,
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
        credentials: "include",
        body: JSON.stringify(eventRequestData)
      });

      const result = await response.json();

      if (response.status === 401) {
        showRequestMessage("Please log in before creating an event request.", "red");
        return;
      }

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit event request.");
      }

      showRequestMessage(
        "Your event request has been submitted and added to the calendar as pending!",
        "green"
      );

      eventRequestForm.reset();
      resetVotes();

      setTimeout(function () {
        window.location.href = "calendar.html";
      }, 1000);
    } catch (error) {
      console.error("Event request submission error:", error);
      showRequestMessage(
        "There was an error submitting your event request. Please try again.",
        "red"
      );
    }
  });
}

function resetVotes() {
  votes.date = "None";
  votes.time = "None";
  votes.location = "None";
  votes.activity = "None";

  ["date", "time", "location", "activity"].forEach(function (category) {
    const voteDisplay = document.getElementById(category + "Vote");

    if (voteDisplay) {
      voteDisplay.textContent = "None";
    }
  });

  pollButtons.forEach(function (button) {
    button.classList.remove("selected");
  });
}

function showRequestMessage(message, color) {
  if (!requestMessage) {
    return;
  }

  requestMessage.textContent = message;
  requestMessage.style.color = color;
}