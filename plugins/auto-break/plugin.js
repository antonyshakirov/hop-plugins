definePlugin({
  onEvent(event, context) {
    if (event.type !== "timer.finished" || event.startedByPlugin) return;
    return {commands: [{
      type: "timer.start",
      seconds: context.settings.breakMinutes * 60
    }]};
  }
});
