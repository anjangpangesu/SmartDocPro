function updateDashboardClock() {
  const clockElement = document.getElementById("dashboard-clock");
  if (clockElement) {
    const now = new Date();
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    };
    clockElement.innerText = now
      .toLocaleDateString("id-ID", options)
      .replace(/\./g, ":");
  }
}

function initApp() {
  updateDashboardStats();

  setInterval(updateDashboardClock, 1000);
  updateDashboardClock();

  if (document.getElementById("container-education").children.length === 0)
    addDynamicField("education");
  if (document.getElementById("container-experience").children.length === 0)
    addDynamicField("experience");
  if (document.getElementById("container-project").children.length === 0)
    addDynamicField("project");
  if (document.getElementById("container-org").children.length === 0)
    addDynamicField("org");
  if (document.getElementById("container-cert").children.length === 0)
    addDynamicField("cert");

  if (document.getElementById("container-skill").children.length === 0)
    addSkillField("skill");
  if (document.getElementById("container-language").children.length === 0)
    addSkillField("language");

  updateCVPreview();
  updateLetterPreview();
  updateLeavePreview();
  updateResignPreview();
  resetSickForm();
  resetInvitationForm();
  resetNotificationForm();

  switchView("dashboard");
}

window.onload = initApp;
