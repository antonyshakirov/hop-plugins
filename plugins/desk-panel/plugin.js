definePlugin({
  activate(context) {
    const accent = /^#[0-9a-f]{6}$/i.test(context.settings.accent)
      ? context.settings.accent : "#5279DB";
    return {
      theme: {light: {accent}, dark: {accent}},
      panel: {mode: "replace", width: 420, nodes: [
        {type: "text", text: context.settings.title, style: "title"},
        {type: "divider"},
        {type: "module", module: "timer"},
        {type: "module", module: "system"}
      ]}
    };
  }
});
