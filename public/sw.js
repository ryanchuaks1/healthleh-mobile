self.addEventListener("push", (event) => {
  let text;
  try {
    text = event.data.text();
    console.log("Push event received:", text);
    const data = JSON.parse(text);
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || "/favicon.png",
      })
    );
  } catch (error) {
    console.error("Error parsing push data:", error);
    // Fallback notification if payload is not in JSON format
    event.waitUntil(
      self.registration.showNotification("Notification", {
        body: text || "You have a new notification.",
        icon: "/favicon.png",
      })
    );
  }
});
