document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // core info
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Add participants section (DOM-built to avoid HTML injection)
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";
        // Inline styles to make it pretty without touching CSS files
        participantsDiv.style.backgroundColor = "#f8fafc";
        participantsDiv.style.padding = "10px";
        participantsDiv.style.border = "1px solid #e6eef6";
        participantsDiv.style.borderRadius = "8px";
        participantsDiv.style.marginTop = "8px";
        participantsDiv.style.maxHeight = "140px";
        participantsDiv.style.overflowY = "auto";

        const participantsHeader = document.createElement("div");
        participantsHeader.style.marginBottom = "6px";
        participantsHeader.style.fontWeight = "600";
        participantsHeader.textContent = "Participants";
        participantsDiv.appendChild(participantsHeader);

        const ul = document.createElement("ul");
        ul.className = "participants-list";
        ul.style.margin = "0";
        ul.style.paddingLeft = "0";
        ul.style.marginBottom = "0";
        ul.style.listStyleType = "none";

        if (Array.isArray(details.participants) && details.participants.length > 0) {
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";
            li.style.display = "flex";
            li.style.alignItems = "center";
            li.style.justifyContent = "space-between";
            li.style.padding = "2px 0";

            const nameSpan = document.createElement("span");
            nameSpan.textContent = p;
            li.appendChild(nameSpan);

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-participant";
            deleteBtn.title = "Remove participant";
            deleteBtn.innerHTML =
              '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c62828" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            deleteBtn.style.background = "none";
            deleteBtn.style.border = "none";
            deleteBtn.style.cursor = "pointer";
            deleteBtn.style.padding = "2px";
            deleteBtn.style.marginLeft = "8px";

            deleteBtn.addEventListener("click", async (e) => {
              e.stopPropagation();
              deleteBtn.disabled = true;
              try {
                const response = await fetch(`/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(p)}`, {
                  method: "POST",
                });
                if (response.ok) {
                  li.remove();
                } else {
                  const result = await response.json();
                  alert(result.detail || "Failed to remove participant.");
                  deleteBtn.disabled = false;
                }
              } catch (err) {
                alert("Error removing participant.");
                deleteBtn.disabled = false;
              }
            });

            li.appendChild(deleteBtn);
            ul.appendChild(li);
          });
        } else {
          const li = document.createElement("li");
          li.className = "participant-empty";
          li.textContent = "No participants yet";
          li.style.fontStyle = "italic";
          li.style.color = "#6b7280";
          ul.appendChild(li);
        }

        participantsDiv.appendChild(ul);
        activityCard.appendChild(participantsDiv);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities list to show new participant
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
